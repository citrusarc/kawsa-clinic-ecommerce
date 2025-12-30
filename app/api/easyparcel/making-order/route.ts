import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_MAKING_ORDER_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_URL!;

async function fetchOrders(mode: string, orderId?: string) {
  if (mode === "cron") {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("paymentStatus", "paid")
      .in("orderWorkflowStatus", [
        "pending_easyparcel_order",
        "payment_confirmed",
      ])
      .is("easyparcelOrderNumber", null);

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

function shouldSkipOrder(order: any): string | null {
  if (!order.serviceId) {
    return "no serviceId";
  }

  if (
    !["pending_easyparcel_order", "payment_confirmed"].includes(
      order.orderWorkflowStatus
    )
  ) {
    return `wrong status: ${order.orderWorkflowStatus}`;
  }

  return null;
}

async function getOrderItems(orderId: string) {
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("orderId", orderId);

  return items || [];
}

function calculateTotalWeight(items: any[]): number {
  return Number(
    items
      .reduce(
        (sum, item) =>
          sum + Number(item.itemWeight || 0) * Number(item.itemQuantity || 1),
        0
      )
      .toFixed(2)
  );
}

function calculateDimensions(items: any[]) {
  return {
    width: Math.max(...items.map((i) => Math.ceil(i.itemWidth || 0))),
    length: Math.max(...items.map((i) => Math.ceil(i.itemLength || 0))),
    height: Math.max(...items.map((i) => Math.ceil(i.itemHeight || 0))),
  };
}

function calculateTotalValue(items: any[]): number {
  return items.reduce((sum, item) => sum + Number(item.itemTotalPrice || 0), 0);
}

function buildEasyParcelPayload(order: any, items: any[]) {
  const totalWeight = calculateTotalWeight(items);
  const dimensions = calculateDimensions(items);
  const totalValue = calculateTotalValue(items);

  return {
    api: EASYPARCEL_API_KEY,
    bulk: [
      {
        weight: totalWeight,
        width: dimensions.width,
        length: dimensions.length,
        height: dimensions.height,
        content: "skincare",
        value: totalValue,
        service_id: order.serviceId,
        pick_name: "DRKAY MEDIBEAUTY SDN BHD",
        pick_contact: "+60123456789",
        pick_addr1: "39-02, Jalan Padi Emas 1/8",
        pick_city: "Johor Bahru",
        pick_state: "Johor",
        pick_code: "81200",
        pick_country: "MY",
        send_name: order.fullName,
        send_contact: order.phoneNumber,
        send_email: order.email,
        send_addr1: order.addressLine1,
        send_addr2: order.addressLine2 || "",
        send_city: order.city,
        send_state: order.state,
        send_code: String(order.postcode),
        send_country: "MY",
        collect_date: new Date().toISOString().split("T")[0],
        sms: true,
        reference: String(order.orderNumber),
      },
    ],
  };
}

async function createEasyParcelOrder(payload: any, orderNumber: string) {
  const response = await fetch(EASYPARCEL_MAKING_ORDER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  console.log(
    `EasyParcel API response for order ${orderNumber}:`,
    JSON.stringify(result)
  );

  if (!response.ok) {
    throw new Error("API request failed");
  }

  if (result?.api_status !== "Success") {
    throw new Error("API returned non-success status");
  }

  const epOrder = result?.result?.[0];
  if (!epOrder?.order_number) {
    throw new Error("No order_number in response");
  }

  return epOrder;
}

async function updateOrderInDatabase(
  orderId: string,
  epOrder: any,
  currentCourierName: string
) {
  const { error } = await supabase
    .from("orders")
    .update({
      easyparcelOrderNumber: epOrder.order_number,
      courierName: epOrder.courier_name || currentCourierName,
      orderWorkflowStatus: "easyparcel_order_created",
      orderStatus: "processing",
    })
    .eq("id", orderId);

  if (error) throw error;
}

async function processOrder(order: any) {
  console.log(`Processing order ${order.orderNumber} (ID: ${order.id})`);

  const skipReason = shouldSkipOrder(order);
  if (skipReason) {
    console.log(`Skipping order ${order.orderNumber} - ${skipReason}`);
    return { skipped: true };
  }

  const items = await getOrderItems(order.id);
  if (items.length === 0) {
    console.log(`Skipping order ${order.orderNumber} - no items`);
    return { skipped: true };
  }

  const totalWeight = calculateTotalWeight(items);
  if (totalWeight <= 0) {
    console.log(`Skipping order ${order.orderNumber} - invalid weight`);
    return { skipped: true };
  }

  const payload = buildEasyParcelPayload(order, items);
  const epOrder = await createEasyParcelOrder(payload, order.orderNumber);
  await updateOrderInDatabase(order.id, epOrder, order.courierName);

  console.log(`Successfully processed order ${order.orderNumber}`);
  return { success: true };
}

async function processOrders(orders: any[]) {
  let processedCount = 0;
  const failedOrders = [];

  for (const order of orders) {
    try {
      const result = await processOrder(order);
      if (result.success) {
        processedCount++;
      }
    } catch (err) {
      console.error(`Failed to process order ${order.orderNumber}:`, err);
      failedOrders.push({
        orderNumber: order.orderNumber,
        error: err instanceof Error ? err.message : "Unknown error",
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
    const { processedCount, failedOrders } = await processOrders(
      ordersToProcess
    );

    return NextResponse.json({
      success: true,
      processedCount,
      totalOrders: ordersToProcess.length,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    console.error("EasyParcel making-order error:", err);

    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";
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
