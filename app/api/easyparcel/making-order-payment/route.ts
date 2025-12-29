import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL!;
const SITE_URL = process.env.SITE_URL!; // // FIX: server-side env

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

    if (order.awbNumber) {
      return NextResponse.json({
        skipped: true,
        reason: "AWB already exists",
      });
    }

    // 2. Build payment payload
    const payload = {
      api: EASYPARCEL_API_KEY,
      bulk: [{ order_no: order.easyparcelOrderNumber }],
    };

    // 3. Call EasyParcel API
    const response = await fetch(EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || result?.api_status !== "Success") {
      console.error("EasyParcel payment error:", result);
      return NextResponse.json(
        { error: "EasyParcel payment failed" },
        { status: 500 }
      );
    }

    const parcelInfo = result?.result?.[0]?.parcel?.[0];

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
        emailSent: false, // // ensure email can be sent
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order shipping info" },
        { status: 500 }
      );
    }

    // 5. Trigger email confirmation
    try {
      const emailRes = await fetch(`${SITE_URL}/api/email-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const emailResult = await emailRes.json(); // //
      console.log("Email API result:", emailResult); // //
    } catch (emailErr) {
      console.error("Failed to trigger email confirmation:", emailErr);
    }

    return NextResponse.json({
      success: true,
      trackingNumber: parcelInfo.parcelno,
      trackingUrl: parcelInfo.tracking_url,
      awbNumber: parcelInfo.awb,
      awbPdfUrl: parcelInfo.awb_id_link,
    });
  } catch (err) {
    console.error("EasyParcel making-order-payment error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
