import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL!;

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

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

    // Ensure EasyParcel order was created
    if (!order.easyparcelOrderNo) {
      return NextResponse.json(
        { error: "EasyParcel order not created yet" },
        { status: 400 }
      );
    }

    // 2. Build payment payload (DOC COMPLIANT)
    const payload = {
      api: EASYPARCEL_API_KEY,
      bulk: [
        {
          order_no: order.easyparcelOrderNo,
        },
      ],
    };

    // 3. Call EasyParcel Making-Order-Payment API
    const response = await fetch(EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

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

    const paymentResult = result?.result?.[0];
    const parcelInfo = paymentResult?.parcel?.[0];

    if (!parcelInfo) {
      return NextResponse.json(
        { error: "AWB data not returned" },
        { status: 500 }
      );
    }

    // 4. Update order with AWB + tracking info
    await supabase
      .from("orders")
      .update({
        trackingNumber: parcelInfo.parcelno,
        awbNumber: parcelInfo.awb, // // but I don't have awbNumber in supabase, need to add? awbNumber and trackingNumber is different?
        awbPdfUrl: parcelInfo.awb_id_link, // // but I don't have awbPdfUrl in supabase, need to add?
        trackingUrl: parcelInfo.tracking_url, // // but I don't have trackingUrl in supabase, need to add?
        deliveryStatus: "ready_for_pickup",
      })
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      parcelNumber: parcelInfo.parcelno,
      awbNumber: parcelInfo.awb,
      awbPdfUrl: parcelInfo.awb_id_link,
      trackingUrl: parcelInfo.tracking_url,
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
