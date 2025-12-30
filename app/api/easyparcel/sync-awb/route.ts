import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_GET_ORDER_URL = process.env.EASYPARCEL_DEMO_GET_ORDER_URL!;

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("orderWorkflowStatus", "payment_done_awb_pending");

    if (error) throw error;
    if (!orders || orders.length === 0)
      return NextResponse.json({ success: true, updated: 0 });

    let updated = 0;
    const failedOrders: { orderNumber: string; error: string }[] = []; // // Added

    for (const order of orders) {
      try {
        if (!order.easyparcelOrderNumber) {
          console.log(
            `Skipping order ${order.orderNumber} - no EasyParcel order number`
          ); // // Added
          failedOrders.push({
            orderNumber: order.orderNumber,
            error: "Missing EasyParcel order number",
          }); // // Added
          continue;
        }

        const payload = {
          api: EASYPARCEL_API_KEY,
          order_no: order.easyparcelOrderNumber,
        };

        const res = await fetch(EASYPARCEL_GET_ORDER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (!res.ok) {
          console.error(
            `EasyParcel API failed for order ${order.orderNumber}:`,
            result
          ); // // Added
          failedOrders.push({
            orderNumber: order.orderNumber,
            error: "EasyParcel API error",
          }); // // Added
          continue;
        }

        const parcel = result?.result?.[0]?.parcel?.[0];

        if (!parcel?.awb) {
          console.log(`AWB not yet available for order ${order.orderNumber}`); // // Added
          continue;
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            trackingNumber: parcel.parcelno,
            trackingUrl: parcel.tracking_url,
            awbNumber: parcel.awb,
            awbPdfUrl: parcel.awb_id_link,
            orderWorkflowStatus: "awb_generated",
            deliveryStatus: "ready_for_pickup",
          })
          .eq("id", order.id);

        if (updateError) {
          console.error(
            `Failed to update order ${order.orderNumber}:`,
            updateError
          ); // // Added
          failedOrders.push({
            orderNumber: order.orderNumber,
            error: "Database update failed",
          }); // // Added
          continue;
        }

        updated++;
      } catch (orderErr) {
        console.error(`Error processing order ${order.orderNumber}:`, orderErr); // // Added
        failedOrders.push({
          orderNumber: order.orderNumber,
          error:
            orderErr instanceof Error ? orderErr.message : String(orderErr),
        }); // // Added
      }
    }

    // // Return detailed response
    return NextResponse.json({
      success: true,
      updated,
      totalOrders: orders.length, // // Added
      failedOrders: failedOrders.length ? failedOrders : undefined, // // Added
    });
  } catch (err) {
    console.error("Sync AWB error:", err); // // Added
    return NextResponse.json(
      {
        error: "Sync failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
