import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL!;

interface EasyParcelParcel {
  parcelno: string;
  tracking_url: string;
  awb: string;
  awb_id_link: string;
}
interface EasyParcelResult {
  messagenow: string;
  parcel: EasyParcelParcel[];
}
interface EasyParcelResponse {
  api_status: string;
  error_remark?: string;
  result?: EasyParcelResult[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, mode } = body;

    if (mode === "cron") {
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let ordersToProcess = [];

    if (mode === "cron") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .not("easyparcelOrderNumber", "is", null)
        .is("trackingNumber", null)
        .eq("paymentStatus", "paid");
      if (error) throw error;
      ordersToProcess = orders;
    } else {
      if (!orderId)
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (orderError || !order)
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      ordersToProcess = [order];
    }

    for (const order of ordersToProcess) {
      if (!order.easyparcelOrderNumber || order.trackingNumber) continue;

      const payload = {
        api: EASYPARCEL_API_KEY,
        bulk: [{ order_no: order.easyparcelOrderNumber }],
      };
      const response = await fetch(EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let result: EasyParcelResponse;
      try {
        result = await response.json();
      } catch {
        continue;
      }

      if (!response.ok || result?.api_status !== "Success") continue;

      const paymentResult = result.result?.[0];
      const parcelInfo = paymentResult?.parcel?.[0];
      if (!parcelInfo) continue;

      await supabase
        .from("orders")
        .update({
          trackingNumber: parcelInfo.parcelno,
          trackingUrl: parcelInfo.tracking_url,
          awbNumber: parcelInfo.awb,
          awbPdfUrl: parcelInfo.awb_id_link,
          deliveryStatus: "ready_for_pickup",
          orderStatus: "processing",
        })
        .eq("id", order.id);
    }

    return NextResponse.json({
      success: true,
      processedOrders: ordersToProcess.length,
    });
  } catch (err) {
    console.error("EasyParcel making-order-payment error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
