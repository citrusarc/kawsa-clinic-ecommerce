import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { transporter } from "@/utils/email";
import { orderEmailConfirmationTemplate } from "@/utils/email/orderEmailConfirmationTemplate";

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

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        full_name,
        email,
        payment_status,
        courier_name,
        tracking_url,
        awb_number,
        sub_total_price,
        shipping_fee,
        total_price,
        delivery_status,
        order_status,
        emailSent,
        order_items (*)
      `
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Guards
    if (order.payment_status !== "paid") {
      return NextResponse.json({ skipped: true, reason: "Not paid" });
    }

    if (!order.awb_number) {
      return NextResponse.json({ skipped: true, reason: "AWB not ready" });
    }

    if (order.emailSent) {
      return NextResponse.json({ skipped: true, reason: "Email already sent" });
    }

    const html = orderEmailConfirmationTemplate({
      orderId: order.id,
      orderNumber: order.order_number,
      fullName: order.full_name,
      email: order.email,
      phoneNumber: "",
      address: "",
      paymentMethod: "",
      paymentStatus: order.payment_status,
      subTotalPrice: order.sub_total_price,
      shippingFee: order.shipping_fee,
      totalPrice: order.total_price,
      courierName: order.courier_name,
      trackingUrl: order.tracking_url,
      awbNumber: order.awb_number,
      deliveryStatus: order.delivery_status,
      orderStatus: order.order_status,
      items: order.order_items ?? [],
    });

    await transporter.sendMail({
      from: `"Kawsa Clinic" <${process.env.EMAIL_USER}>`,
      to: order.email,
      subject: `Your order ${order.order_number} is on the way 🚚`,
      html,
    });

    await supabase
      .from("orders")
      .update({ emailSent: true })
      .eq("id", order.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
