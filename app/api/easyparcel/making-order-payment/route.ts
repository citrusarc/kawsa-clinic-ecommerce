import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { EasyParcelResponse, EasyParcelItem } from "@/types";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_MAKING_ORDER_PAYMENT_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, mode } = body;

    if (mode === "cron") {
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let ordersToProcess = [];

    if (mode === "cron") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("orderWorkflowStatus", "easyparcel_order_created")
        .eq("paymentStatus", "paid")
        .is("trackingNumber", null);

      if (error) throw error;
      ordersToProcess = orders || [];
    } else {
      if (!orderId) {
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }

      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      ordersToProcess = [order];
    }

    let processedCount = 0;
    const failedOrders = [];

    for (const order of ordersToProcess) {
      const payload = {
        api: EASYPARCEL_API_KEY,
        bulk: [{ order_no: order.easyparcelOrderNumber }],
      };

      let result: EasyParcelResponse;
      try {
        const response = await fetch(EASYPARCEL_MAKING_ORDER_PAYMENT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        result = await response.json();

        if (!response.ok || result.api_status !== "Success") {
          throw new Error("Payment API failed");
        }
      } catch (err) {
        console.error("Payment API error for order:", order.orderNumber, err);
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "Payment API error",
        });
        continue;
      }

      const paymentResult = result?.result?.[0];

      // DEBUG: Log the entire response structure
      console.log(`\n=== DEBUG ORDER ${order.orderNumber} ===`);
      console.log("Full result:", JSON.stringify(result, null, 2));
      console.log("Payment result:", JSON.stringify(paymentResult, null, 2));
      console.log(
        "Parcel data:",
        JSON.stringify(paymentResult?.parcel, null, 2)
      );
      console.log("=== END DEBUG ===\n");

      // Check if parcel data exists
      if (!paymentResult || !paymentResult.parcel) {
        console.log(
          `❌ AWB pending for order ${order.orderNumber} - no parcel data`
        );
        await supabase
          .from("orders")
          .update({
            orderWorkflowStatus: "payment_done_awb_pending",
          })
          .eq("id", order.id);
        processedCount++;
        continue;
      }

      // EasyParcel returns parcel as an array, get the first item
      const parcelList = Array.isArray(paymentResult.parcel)
        ? paymentResult.parcel
        : [paymentResult.parcel];

      console.log(`Parcel list length: ${parcelList.length}`);

      const parcel = parcelList[0];
      console.log(`First parcel:`, JSON.stringify(parcel, null, 2));

      // Check if AWB is ready
      if (!parcel || !parcel.awb || !parcel.parcel_number) {
        console.log(
          `❌ AWB pending for order ${order.orderNumber} - AWB not ready yet`
        );
        console.log(`Parcel exists: ${!!parcel}`);
        console.log(`Has AWB: ${!!parcel?.awb}`);
        console.log(`Has parcel_number: ${!!parcel?.parcel_number}`);
        await supabase
          .from("orders")
          .update({
            orderWorkflowStatus: "payment_done_awb_pending",
          })
          .eq("id", order.id);
        processedCount++;
        continue;
      }

      // AWB is ready - update order
      await supabase
        .from("orders")
        .update({
          trackingNumber: parcel.parcel_number,
          trackingUrl: parcel.tracking_url || null,
          awbNumber: parcel.awb,
          awbPdfUrl: parcel.awb_id_link || null,
          orderWorkflowStatus: "awb_generated",
          deliveryStatus: parcel.ship_status || "ready_for_pickup",
          orderStatus: "processing",
        })
        .eq("id", order.id);

      console.log(
        `✓ Updated order ${order.orderNumber} with AWB ${parcel.awb}`
      );
      processedCount++;
    }

    return NextResponse.json({
      success: true,
      processedCount,
      totalOrders: ordersToProcess.length,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    console.error("EasyParcel making-order-payment error:", err);
    return NextResponse.json(
      { error: "Internal error", details: String(err) },
      { status: 500 }
    );
  }
}
