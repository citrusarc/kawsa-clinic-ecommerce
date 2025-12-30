import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_GET_ORDER_URL = process.env.EASYPARCEL_DEMO_GET_ORDER_URL!;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("orderWorkflowStatus", "payment_done_awb_pending");

    if (fetchError) {
      console.error("Failed to fetch pending AWB orders:", fetchError);
      throw fetchError;
    }

    if (!orders?.length) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: "No pending AWB orders",
      });
    }

    let updatedCount = 0;
    const failedOrders: { orderNumber: string; error: string }[] = [];

    for (const order of orders) {
      const orderNumber = String(order.orderNumber ?? "UNKNOWN");
      const easyparcelOrderNo = String(order.easyparcelOrderNumber ?? "");

      try {
        if (!easyparcelOrderNo.trim()) {
          failedOrders.push({
            orderNumber,
            error: "Missing EasyParcel order number",
          });
          continue;
        }

        const response = await fetch(EASYPARCEL_GET_ORDER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api: EASYPARCEL_API_KEY,
            order_no: easyparcelOrderNo,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          console.error(
            `EasyParcel API failed for ${orderNumber} (HTTP ${response.status}):`,
            errorText
          );
          failedOrders.push({
            orderNumber,
            error: `EasyParcel API error - HTTP ${response.status}`,
          });
          continue;
        }

        const result = await response.json();
        const parcel = result?.result?.[0]?.parcel?.[0];

        if (!parcel?.awb) {
          continue;
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            trackingNumber: parcel.parcelno ? String(parcel.parcelno) : null,
            trackingUrl: parcel.tracking_url || null,
            awbNumber: String(parcel.awb),
            awbPdfUrl: parcel.awb_id_link || null,
            orderWorkflowStatus: "awb_generated",
            deliveryStatus: "ready_for_pickup",
          })
          .eq("id", order.id);

        if (updateError) {
          console.error(
            `Database update failed for ${orderNumber}:`,
            updateError
          );
          failedOrders.push({
            orderNumber,
            error: "Database update failed",
          });
          continue;
        }

        updatedCount++;
      } catch (orderErr) {
        const errorMessage = getErrorMessage(orderErr);
        console.error(`Error processing order ${orderNumber}:`, errorMessage);
        failedOrders.push({
          orderNumber,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalOrders: orders.length,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    console.error("Critical sync AWB error:", errorMessage, err);
    return NextResponse.json(
      {
        success: false,
        error: "Sync failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
