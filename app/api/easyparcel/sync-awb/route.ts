import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_GET_ORDER_URL = process.env.EASYPARCEL_DEMO_GET_ORDER_URL!;

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch orders with pending AWB
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("orderWorkflowStatus", "payment_done_awb_pending");

    if (error) throw error;
    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    let updated = 0;
    const failedOrders: { orderNumber: string; error: string }[] = [];

    for (const order of orders) {
      const orderNumberSafe = order.orderNumber?.toString() || "unknown";
      const orderIdSafe = order.id;

      try {
        // Skip orders with missing EasyParcel order number
        if (!order.easyparcelOrderNumber) {
          console.log(
            `Skipping order ${orderNumberSafe} - no EasyParcel order number`
          );
          failedOrders.push({
            orderNumber: orderNumberSafe,
            error: "Missing EasyParcel order number",
          });
          continue;
        }

        const payload = {
          api: EASYPARCEL_API_KEY,
          order_no: order.easyparcelOrderNumber?.toString() || "",
        };

        const res = await fetch(EASYPARCEL_GET_ORDER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (!res.ok) {
          console.error(
            `EasyParcel API failed for order ${orderNumberSafe}:`,
            result
          );
          failedOrders.push({
            orderNumber: orderNumberSafe,
            error: "EasyParcel API error",
          });
          continue;
        }

        const parcel = result?.result?.[0]?.parcel?.[0];

        if (!parcel?.awb) {
          console.log(`AWB not yet available for order ${orderNumberSafe}`);
          continue;
        }

        // Update order safely
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            trackingNumber: parcel.parcelno?.toString() || null,
            trackingUrl: parcel.tracking_url || null,
            awbNumber: parcel.awb?.toString() || null,
            awbPdfUrl: parcel.awb_id_link || null,
            orderWorkflowStatus: "awb_generated",
            deliveryStatus: "ready_for_pickup",
          })
          .eq("id", orderIdSafe);

        if (updateError) {
          console.error(
            `Failed to update order ${orderNumberSafe}:`,
            updateError
          );
          failedOrders.push({
            orderNumber: orderNumberSafe,
            error: "Database update failed",
          });
          continue;
        }

        updated++;
      } catch (orderErr) {
        console.error(`Error processing order ${orderNumberSafe}:`, orderErr);
        failedOrders.push({
          orderNumber: orderNumberSafe,
          error:
            orderErr instanceof Error ? orderErr.message : String(orderErr),
        });
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      totalOrders: orders.length,
      failedOrders: failedOrders.length ? failedOrders : undefined,
    });
  } catch (err) {
    console.error("Sync AWB error:", err);
    return NextResponse.json(
      {
        error: "Sync failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
