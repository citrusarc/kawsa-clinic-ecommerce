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
      if (cronSecret !== process.env.CRON_SECRET)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // // Modified: fetch multiple orders for cron
    let ordersToProcess = [];

    if (mode === "cron") {
      const { data: orders, error } = await supabase
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
        .eq("payment_status", "paid")
        .not("awb_number", "is", null)
        .eq("emailSent", false);
      if (error) throw error;
      ordersToProcess = orders;
    } else {
      if (!orderId)
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
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
      if (error || !order)
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      ordersToProcess = [order];
    }

    for (const order of ordersToProcess) {
      if (order.emailSent) continue;

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
    }

    return NextResponse.json({
      success: true,
      processedOrders: ordersToProcess.length,
    }); // // modified
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
