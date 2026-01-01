import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

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
      console.log(
        `\n--- Processing payment for order ${order.orderNumber} ---`
      );

      const paymentPayload = {
        api: EASYPARCEL_API_KEY,
        bulk: [{ order_no: order.easyparcelOrderNumber }],
      };

      let result;
      try {
        const response = await fetch(EASYPARCEL_MAKING_ORDER_PAYMENT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentPayload),
        });
        result = await response.json();

        console.log(
          `💳 Payment API response:`,
          JSON.stringify(result, null, 2)
        );

        if (!response.ok || result.api_status !== "Success") {
          throw new Error("Payment API failed");
        }
      } catch (err) {
        console.error("❌ Payment API error:", err);
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "Payment API error",
        });
        continue;
      }

      // According to docs: result[0] → parcel[] → { parcelno, awb, awb_id_link, tracking_url }
      // But your logs show: result[0] → result[] → { parcel_number, awb, awb_id_link, tracking_url }
      const paymentResult = result?.result?.[0];

      if (!paymentResult) {
        console.log(`❌ No payment result for order ${order.orderNumber}`);
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "No payment result",
        });
        continue;
      }

      // Try both possible structures (docs say "parcel", logs show "result")
      let parcelList = [];
      if (Array.isArray(paymentResult.parcel)) {
        parcelList = paymentResult.parcel;
        console.log(`📦 Using "parcel" field from payment response`);
      } else if (Array.isArray(paymentResult.result)) {
        parcelList = paymentResult.result;
        console.log(`📦 Using "result" field from payment response`);
      }

      console.log(`📦 Parcel list length: ${parcelList.length}`);
      console.log(`📦 Parcel data:`, JSON.stringify(parcelList, null, 2));

      if (parcelList.length === 0) {
        console.log(`⏳ AWB not ready yet for order ${order.orderNumber}`);
        await supabase
          .from("orders")
          .update({ orderWorkflowStatus: "payment_done_awb_pending" })
          .eq("id", order.id);
        processedCount++;
        continue;
      }

      const parcel = parcelList[0];

      // Handle both field name variations
      const parcelNumber = parcel.parcel_number || parcel.parcelno;
      const awbNumber = parcel.awb;
      const awbPdfUrl = parcel.awb_id_link;
      const trackingUrl = parcel.tracking_url;

      console.log(`📦 Extracted data:`, {
        parcelNumber,
        awbNumber,
        awbPdfUrl,
        trackingUrl,
      });

      // Check if AWB is ready (AWB can be empty string or null when not ready)
      if (!awbNumber || !parcelNumber) {
        console.log(`⏳ AWB not ready yet for order ${order.orderNumber}`);
        console.log(`  - Has parcel_number: ${!!parcelNumber}`);
        console.log(`  - Has awb: ${!!awbNumber}`);
        await supabase
          .from("orders")
          .update({ orderWorkflowStatus: "payment_done_awb_pending" })
          .eq("id", order.id);
        processedCount++;
        continue;
      }

      // AWB is ready - update order with full tracking info
      const updateData = {
        trackingNumber: parcelNumber,
        trackingUrl: trackingUrl || null,
        awbNumber: awbNumber,
        awbPdfUrl: awbPdfUrl || null,
        orderWorkflowStatus: "awb_generated",
        deliveryStatus: parcel.ship_status || "ready_for_pickup",
        orderStatus: "processing",
      };

      console.log(
        `💾 Updating order with:`,
        JSON.stringify(updateData, null, 2)
      );

      await supabase.from("orders").update(updateData).eq("id", order.id);

      console.log(
        `✅ Updated order ${order.orderNumber} with AWB ${awbNumber}`
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
