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
        const orderNumberSafe = order.orderNumber?.toString() || "unknown"; // // Added: safe toString
        const orderIdSafe = order.id;

        if (!order.easyparcelOrderNumber) {
          console.log(
            `Skipping order ${orderNumberSafe} - no EasyParcel order number`
          ); // // Added
          failedOrders.push({
            orderNumber: orderNumberSafe,
            error: "Missing EasyParcel order number",
          }); // // Added
          continue;
        }

        const payload = {
          api: EASYPARCEL_API_KEY,
          order_no: order.easyparcelOrderNumber.toString(), // // Added: safe toString
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
          ); // // Added
          failedOrders.push({
            orderNumber: orderNumberSafe,
            error: "EasyParcel API error",
          }); // // Added
          continue;
        }

        const parcel = result?.result?.[0]?.parcel?.[0];

        if (!parcel?.awb) {
          console.log(`AWB not yet available for order ${orderNumberSafe}`); // // Added
          continue;
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            trackingNumber: parcel.parcelno?.toString() || null, // // Added safe toString
            trackingUrl: parcel.tracking_url || null, // // Added fallback
            awbNumber: parcel.awb?.toString() || null, // // Added safe toString
            awbPdfUrl: parcel.awb_id_link || null, // // Added fallback
            orderWorkflowStatus: "awb_generated",
            deliveryStatus: "ready_for_pickup",
          })
          .eq("id", orderIdSafe);

        if (updateError) {
          console.error(
            `Failed to update order ${orderNumberSafe}:`,
            updateError
          ); // // Added
          failedOrders.push({
            orderNumber: orderNumberSafe,
            error: "Database update failed",
          }); // // Added
          continue;
        }

        updated++;
      } catch (orderErr) {
        console.error(`Error processing order ${order.orderNumber}:`, orderErr); // // Added
        failedOrders.push({
          orderNumber: order.orderNumber?.toString() || "unknown", // // Added safe fallback
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
