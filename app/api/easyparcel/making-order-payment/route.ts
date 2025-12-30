import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/utils/supabase/client";
import { EasyParcelResponse } from "@/types";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_MAKING_ORDER_PAYMENT_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL!;

async function fetchOrders(mode: string, orderId?: string) {
  if (mode === "cron") {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("orderWorkflowStatus", "easyparcel_order_created")
      .eq("paymentStatus", "paid")
      .is("trackingNumber", null);

    if (error) throw error;
    return orders || [];
  }

  if (!orderId) {
    throw new Error("Missing orderId");
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error("Order not found");
  }

  return [order];
}

async function makePayment(easyparcelOrderNumber: string) {
  const payload = {
    api: EASYPARCEL_API_KEY,
    bulk: [{ order_no: easyparcelOrderNumber }],
  };

  const response = await fetch(EASYPARCEL_MAKING_ORDER_PAYMENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result: EasyParcelResponse = await response.json();
  console.log("Payment response:", JSON.stringify(result));

  if (!response.ok || result.api_status !== "Success") {
    throw new Error("Payment API failed");
  }

  return result;
}

async function updateOrderStatus(order: any, parcel: any) {
  if (!parcel?.awb) {
    console.log(
      `Payment successful, AWB pending for order ${order.orderNumber}`
    );

    await supabase
      .from("orders")
      .update({
        orderWorkflowStatus: "payment_done_awb_pending",
      })
      .eq("id", order.id);

    return;
  }

  await supabase
    .from("orders")
    .update({
      trackingNumber: parcel.parcelno,
      trackingUrl: parcel.tracking_url,
      awbNumber: parcel.awb,
      awbPdfUrl: parcel.awb_id_link,
      orderWorkflowStatus: "awb_generated",
      deliveryStatus: "ready_for_pickup",
      orderStatus: "processing",
    })
    .eq("id", order.id);
}

async function processPayments(orders: any[]) {
  let processedCount = 0;
  const failedOrders = [];

  for (const order of orders) {
    console.log(
      `Processing payment for order ${order.orderNumber} (${order.easyparcelOrderNumber})`
    );

    try {
      const result = await makePayment(order.easyparcelOrderNumber);
      const paymentResult = result.result?.[0];
      const parcel = paymentResult?.parcel?.[0];

      await updateOrderStatus(order, parcel);
      processedCount++;
    } catch (err) {
      console.error(`Failed to process order ${order.orderNumber}:`, err);
      failedOrders.push({
        orderNumber: order.orderNumber,
        error: "Payment API error",
      });
    }
  }

  return { processedCount, failedOrders };
}

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

    const ordersToProcess = await fetchOrders(mode, orderId);
    const { processedCount, failedOrders } = await processPayments(
      ordersToProcess
    );

    return NextResponse.json({
      success: true,
      processedCount,
      totalOrders: ordersToProcess.length,
      failedOrders: failedOrders.length ? failedOrders : undefined,
    });
  } catch (err) {
    console.error("EasyParcel making-order-payment error:", err);

    const errorMessage = err instanceof Error ? err.message : "Internal error";
    const statusCode =
      errorMessage === "Missing orderId"
        ? 400
        : errorMessage === "Order not found"
        ? 404
        : 500;

    return NextResponse.json(
      { error: errorMessage, details: String(err) },
      { status: statusCode }
    );
  }
}
