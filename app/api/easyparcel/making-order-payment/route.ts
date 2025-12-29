import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL!;

// // Define proper types for EasyParcel response
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
      if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // 1. Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Order not paid yet" },
        { status: 400 }
      );
    }

    if (!order.easyparcelOrderNumber) {
      return NextResponse.json(
        { error: "EasyParcel order not created yet" },
        { status: 400 }
      );
    }

    if (order.trackingNumber) {
      return NextResponse.json({ skipped: true, reason: "Already paid" });
    }

    // 2. Build payment payload
    const payload = {
      api: EASYPARCEL_API_KEY,
      bulk: [{ order_no: order.easyparcelOrderNumber }],
    };

    // 3. Call EasyParcel Making-Order-Payment API
    const response = await fetch(EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let result: EasyParcelResponse; // // replaced any with typed interface
    try {
      result = await response.json();
    } catch (err) {
      // // prefix with _ to mark unused
      const text = await response.text();
      console.error("EasyParcel returned non-JSON:", text, err);
      return NextResponse.json(
        { error: "EasyParcel response is not JSON", detail: text },
        { status: 500 }
      );
    }

    if (!response.ok || result?.api_status !== "Success") {
      console.error("EasyParcel payment error:", result);
      return NextResponse.json(
        {
          error: "EasyParcel payment failed",
          detail: result?.error_remark || "Unknown error",
        },
        { status: 500 }
      );
    }

    const paymentResult = result.result?.[0];
    const parcelInfo = paymentResult?.parcel?.[0];

    if (!parcelInfo) {
      return NextResponse.json(
        { error: "Parcel / AWB data not returned" },
        { status: 500 }
      );
    }

    // 4. Update order with shipping info
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        trackingNumber: parcelInfo.parcelno,
        trackingUrl: parcelInfo.tracking_url,
        awbNumber: parcelInfo.awb,
        awbPdfUrl: parcelInfo.awb_id_link,
        deliveryStatus: "ready_for_pickup",
        orderStatus: "processing",
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order shipping info" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      easyparcelOrderNumber: order.easyparcelOrderNumber,
      trackingNumber: parcelInfo.parcelno,
      trackingUrl: parcelInfo.tracking_url,
      awbNumber: parcelInfo.awb,
      awbPdfUrl: parcelInfo.awb_id_link,
      message: paymentResult?.messagenow,
    });
  } catch (err) {
    console.error("EasyParcel making-order-payment error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
