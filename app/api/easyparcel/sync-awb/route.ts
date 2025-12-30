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

    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("orderWorkflowStatus", "payment_done_awb_pending");

    if (fetchError) {
      console.error("Failed to fetch pending AWB orders:", fetchError);
      throw fetchError;
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "No pending AWB orders",
      });
    }

    const { updatedCount, failedOrders } = await processOrders(orders);

    return NextResponse.json({
      success: true,
      updatedCount,
      totalOrders: orders.length,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
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

async function processOrders(orders: any[]) {
  let updatedCount = 0;
  const failedOrders: { orderNumber: string; error: string }[] = [];

  for (const order of orders) {
    const orderNumber = String(order.orderNumber ?? "UNKNOWN");
    const easyparcelOrderNo = String(order.easyparcelOrderNumber ?? "");

    try {
      if (!easyparcelOrderNo.trim()) {
        console.log(
          `Skipping order ${orderNumber} - missing EasyParcel order number`
        );
        failedOrders.push({
          orderNumber,
          error: "Missing EasyParcel order number",
        });
        continue;
      }

      const parcel = await fetchParcelInfo(
        easyparcelOrderNo,
        orderNumber,
        failedOrders
      );
      if (!parcel) continue;

      const success = await updateOrderWithAWB(
        order,
        parcel,
        orderNumber,
        failedOrders
      );
      if (success) {
        updatedCount++;
      }
    } catch (orderErr) {
      const errorMessage =
        orderErr instanceof Error ? orderErr.message : String(orderErr);
      console.error(`Error processing order ${orderNumber}:`, errorMessage);
      failedOrders.push({
        orderNumber,
        error: errorMessage,
      });
    }
  }

  return { updatedCount, failedOrders };
}

async function fetchParcelInfo(
  easyparcelOrderNo: string,
  orderNumber: string,
  failedOrders: { orderNumber: string; error: string }[]
) {
  const payload = {
    api: EASYPARCEL_API_KEY,
    order_no: easyparcelOrderNo,
  };

  const response = await fetch(EASYPARCEL_GET_ORDER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
    return null;
  }

  const result = await response.json();
  const parcel = result?.result?.[0]?.parcel?.[0];

  if (!parcel || !parcel.awb) {
    console.log(`AWB not yet available for order ${orderNumber}`);
    return null;
  }

  return parcel;
}

async function updateOrderWithAWB(
  order: any,
  parcel: any,
  orderNumber: string,
  failedOrders: { orderNumber: string; error: string }[]
): Promise<boolean> {
  const updateData = {
    trackingNumber: parcel.parcelno ? String(parcel.parcelno) : null,
    trackingUrl: parcel.tracking_url || null,
    awbNumber: parcel.awb ? String(parcel.awb) : null,
    awbPdfUrl: parcel.awb_id_link || null,
    orderWorkflowStatus: "awb_generated",
    deliveryStatus: "ready_for_pickup",
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", order.id);

  if (updateError) {
    console.error(`Database update failed for ${orderNumber}:`, updateError);
    failedOrders.push({
      orderNumber,
      error: "Database update failed",
    });
    return false;
  }

  console.log(`Successfully synced AWB for order ${orderNumber}`);
  return true;
}
