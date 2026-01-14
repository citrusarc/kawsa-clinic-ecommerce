import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/utils/neon/client";

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
      const orders = await sql`
        SELECT * FROM orders
        WHERE "orderWorkflowStatus" = 'easyparcel_order_created'
          AND "paymentStatus" = 'paid'
          AND "trackingNumber" IS NULL
      `;

      ordersToProcess = orders || [];
    } else {
      if (!orderId) {
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }

      const orderData = await sql`
        SELECT * FROM orders
        WHERE id = ${orderId}
      `;

      if (!orderData || orderData.length === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      ordersToProcess = [orderData[0]];
    }

    let processedCount = 0;
    const failedOrders = [];

    for (const order of ordersToProcess) {
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
        if (!response.ok || result.api_status !== "Success") {
          throw new Error("Payment API failed");
        }
      } catch (err) {
        console.error("Payment API error:", err);
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "Payment API error",
        });
        continue;
      }

      const paymentResult = result?.result?.[0];
      if (!paymentResult) {
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "No payment result",
        });
        continue;
      }

      let parcelList = [];
      if (Array.isArray(paymentResult.parcel)) {
        parcelList = paymentResult.parcel;
      } else if (Array.isArray(paymentResult.result)) {
        parcelList = paymentResult.result;
      }

      if (parcelList.length === 0) {
        await sql`
          UPDATE orders
          SET "orderWorkflowStatus" = 'payment_done_awb_pending',
              "orderStatus" = 'processing'
          WHERE id = ${order.id}
        `;
        processedCount++;
        continue;
      }

      const parcel = parcelList[0];
      const parcelNumber = parcel.parcel_number || parcel.parcelno;
      const awbNumber = parcel.awb;

      if (!awbNumber || awbNumber.trim() === "" || !parcelNumber) {
        await sql`
          UPDATE orders
          SET "orderWorkflowStatus" = 'payment_done_awb_pending',
              "orderStatus" = 'processing'
          WHERE id = ${order.id}
        `;
        processedCount++;
        continue;
      }

      await sql`
        UPDATE orders
        SET "trackingNumber" = ${parcelNumber},
            "trackingUrl" = ${parcel.tracking_url || null},
            "awbNumber" = ${awbNumber},
            "awbPdfUrl" = ${parcel.awb_id_link || null},
            "orderWorkflowStatus" = 'awb_generated',
            "deliveryStatus" = ${parcel.ship_status || "ready_for_pickup"},
            "orderStatus" = 'processing'
        WHERE id = ${order.id}
      `;

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
