// /api/easyparcel/sync-awb/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

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

        // // Changed to use EPParcelStatusBulk endpoint with bulk array format
        const response = await fetch(EASYPARCEL_PARCEL_STATUS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api: EASYPARCEL_API_KEY,
            // // Changed from single order_no to bulk array format
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

        // // Changed to check api_status instead of result structure
        if (result?.api_status !== "Success") {
          failedOrders.push({
            orderNumber,
            error: result?.error_remark || "API returned non-success status",
          });
          continue;
        }

        // // Changed to access result array from EPParcelStatusBulk response
        const orderResult = result?.result?.[0];

        // // Changed to check status field from EPParcelStatusBulk response
        if (!orderResult || orderResult.status !== "Success") {
          failedOrders.push({
            orderNumber,
            error:
              orderResult?.remarks || "Invalid EasyParcel response structure",
          });
          continue;
        }

        // // Ensure parcel array exists and has at least 1 item
        const parcelList = Array.isArray(orderResult.parcel)
          ? orderResult.parcel
          : [];

        if (parcelList.length === 0) {
          // // Multi-item orders often return empty parcel array initially
          console.log(`AWB not ready yet for ${orderNumber}`);
          continue;
        }

        // // Take the first parcel safely
        const parcel = parcelList[0];

        // // Changed field names to match EPParcelStatusBulk response (parcel_number instead of parcelno)
        if (!parcel?.awb || !parcel?.parcel_number) {
          console.log(`Parcel exists but AWB missing for ${orderNumber}`);
          continue;
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            // // Changed from parcel.parcelno to parcel.parcel_number
            trackingNumber: String(parcel.parcel_number),
            // // Note: EPParcelStatusBulk doesn't return tracking_url, only awb_id_link
            trackingUrl: null,
            awbNumber: String(parcel.awb),
            awbPdfUrl: parcel.awb_id_link || null,
            orderWorkflowStatus: "awb_generated",
            // // Changed to map ship_status to deliveryStatus
            deliveryStatus: parcel.ship_status || "ready_for_pickup",
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
