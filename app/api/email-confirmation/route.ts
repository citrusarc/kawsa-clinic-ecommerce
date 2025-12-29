import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { transporter } from "@/utils/email";
import { orderEmailConfirmationTemplate } from "@/utils/email/orderEmailConfirmationTemplate";
import type { OrderItem, OrderEmailConfirmationTemplateProps } from "@/types";

interface Order {
  id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  paymentStatus: string;
  courierName: string;
  trackingUrl: string | null;
  awbNumber: string | null;
  subTotalPrice: number;
  shippingFee: number;
  totalPrice: number;
  deliveryStatus: string;
  orderStatus: string;
  emailSent: boolean;
  order_items?: OrderItem[];
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

    let ordersToProcess: Order[] = [];

    if (mode === "cron") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          orderNumber,
          fullName,
          email,
          paymentStatus,
          courierName,
          trackingUrl,
          awbNumber,
          subTotalPrice,
          shippingFee,
          totalPrice,
          deliveryStatus,
          orderStatus,
          emailSent,
          order_items (*)
        `
        )
        .eq("paymentStatus", "paid")
        .not("awbNumber", "is", null)
        .eq("emailSent", false);

      if (error) throw error;
      ordersToProcess = (orders ?? []) as Order[];
    } else {
      if (!orderId)
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

      const { data: order, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          orderNumber,
          fullName,
          email,
          paymentStatus,
          courierName,
          trackingUrl,
          awbNumber,
          subTotalPrice,
          shippingFee,
          totalPrice,
          deliveryStatus,
          orderStatus,
          emailSent,
          order_items (*)
        `
        )
        .eq("id", orderId)
        .single();

      if (error || !order)
        return NextResponse.json({ error: "Order not found" }, { status: 404 });

      ordersToProcess = [order as Order];
    }

    let processedCount = 0;

    for (const order of ordersToProcess) {
      if (order.emailSent) continue;
      if (!order.awbNumber) {
        console.log(`Skipping order ${order.orderNumber} - AWB not ready`);
        continue;
      }

      const html = orderEmailConfirmationTemplate({
        orderId: order.id,
        orderNumber: order.orderNumber,
        fullName: order.fullName,
        email: order.email,
        phoneNumber: "",
        address: "",
        paymentMethod: "",
        paymentStatus: order.paymentStatus,
        subTotalPrice: order.subTotalPrice,
        shippingFee: order.shippingFee,
        totalPrice: order.totalPrice,
        courierName: order.courierName,
        trackingUrl: order.trackingUrl,
        awbNumber: order.awbNumber,
        deliveryStatus: order.deliveryStatus,
        orderStatus: order.orderStatus,
        items: order.order_items ?? [],
      } as OrderEmailConfirmationTemplateProps);

      const info = await transporter.sendMail({
        from: `"Kawsa Clinic" <${process.env.EMAIL_USER}>`,
        to: order.email,
        subject: `Your order ${order.orderNumber} is on the way 🚚`,
        html,
      });

      console.log(`Email sent to ${order.email}:`, info.messageId);

      await supabase
        .from("orders")
        .update({ emailSent: true })
        .eq("id", order.id);

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      processedOrders: processedCount,
    });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
