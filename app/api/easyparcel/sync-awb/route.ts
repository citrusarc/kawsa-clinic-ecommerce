import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { EasyParcelItem } from "@/types";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_PARCEL_STATUS_URL =
  process.env.EASYPARCEL_DEMO_PARCEL_STATUS_URL!;

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

        const response = await fetch(EASYPARCEL_PARCEL_STATUS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api: EASYPARCEL_API_KEY,
            bulk: [{ order_no: easyparcelOrderNo }],
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

        if (result?.api_status !== "Success") {
          failedOrders.push({
            orderNumber,
            error: result?.error_remark || "API returned non-success status",
          });
          continue;
        }

        const orderResult = result?.result?.[0];
        if (!orderResult || orderResult.status !== "Success") {
          failedOrders.push({
            orderNumber,
            error:
              orderResult?.remarks || "Invalid EasyParcel response structure",
          });
          continue;
        }

        // Ensure parcel array exists and has at least 1 item
        const parcelList = Array.isArray(orderResult.parcel)
          ? orderResult.parcel
          : [];

        if (parcelList.length === 0) {
          // Multi-item orders often return empty parcel array initially
          console.log(`AWB not ready yet for ${orderNumber}`);
          continue;
        }

        // Process all parcels for multi-item orders
        // // Fixed type from any to EasyParcelParcelItem
        const parcels = parcelList.filter(
          (params: EasyParcelItem) => params?.awb && params?.parcel_number
        );

        if (parcels.length === 0) {
          console.log(`Parcels exist but AWB missing for ${orderNumber}`);
          continue;
        }

        // For multi-item orders, store all tracking info
        // Using first parcel's AWB as primary (common practice)
        const primaryParcel = parcels[0];
        // // Fixed type from any to EasyParcelParcelItem
        const allTrackingNumbers = parcels
          .map((p: EasyParcelItem) => p.parcel_number)
          .join(", ");
        // // Fixed type from any to EasyParcelParcelItem
        const allAwbNumbers = parcels
          .map((p: EasyParcelItem) => p.awb)
          .join(", ");

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            trackingNumber: allTrackingNumbers,
            trackingUrl: null,
            awbNumber: allAwbNumbers,
            awbPdfUrl: primaryParcel.awb_id_link || null,
            orderWorkflowStatus: "awb_generated",
            deliveryStatus: primaryParcel.ship_status || "ready_for_pickup",
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

        console.log(
          `✓ Updated order ${orderNumber} with ${parcels.length} parcel(s)`
        );
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
