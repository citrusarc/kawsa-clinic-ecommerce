import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/utils/supabase/client";
import { transporter } from "@/utils/email";
import { emailSendTrackingTemplate } from "@/utils/email/emailSendTrackingTemplate";
import type { OrderSuccessBody } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, mode } = body;

    if (mode === "cron") {
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const orderSelectQuery = `
      id,
      orderNumber,
      fullName,
      email,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postcode,
      country,
      paymentMethod,
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
      orderWorkflowStatus,
      order_items (*)
    `;

    let ordersToProcess: OrderSuccessBody[] = [];

    if (mode === "cron") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(orderSelectQuery)
        .eq("paymentStatus", "paid")
        .not("awbNumber", "is", null)
        .eq("orderWorkflowStatus", "awb_generated")
        .eq("emailSent", false);

      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }

      console.log(
        `Found ${orders?.length || 0} orders ready for email confirmation`
      );
      ordersToProcess = (orders ?? []) as OrderSuccessBody[];
    } else {
      if (!orderNumber) {
        return NextResponse.json(
          { error: "Missing orderNumber" },
          { status: 400 }
        );
      }

      const { data: order, error } = await supabase
        .from("orders")
        .select(orderSelectQuery)
        .eq("orderNumber", orderNumber)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      ordersToProcess = [order as OrderSuccessBody];
    }

    let processedCount = 0;
    const failedEmails = [];

    for (const order of ordersToProcess) {
      console.log(`Processing email for order ${order.orderNumber}`);

      if (order.orderWorkflowStatus !== "awb_generated") {
        console.log(
          `Skipping order ${order.orderNumber} - wrong workflow status: ${order.orderWorkflowStatus}`
        );
        continue;
      }

      if (order.emailSent) {
        console.log(`Skipping order ${order.orderNumber} - email already sent`);
        continue;
      }

      if (!order.awbNumber) {
        console.log(`Skipping order ${order.orderNumber} - AWB not ready`);
        continue;
      }

      if (!order.email) {
        console.error(`Order ${order.orderNumber} has no email address`);
        failedEmails.push({
          orderNumber: order.orderNumber,
          error: "No email address",
        });
        continue;
      }

      const address = [
        order.addressLine1,
        order.addressLine2,
        order.postcode,
        order.city,
        order.state,
        order.country,
      ]
        .filter(Boolean)
        .join(", ");

      try {
        await transporter.sendMail({
          from: `"Kawsa Clinic" <${process.env.EMAIL_USER}>`,
          to: order.email,
          subject: `Your order ${order.orderNumber} is on the way 🚚`,
          html: emailSendTrackingTemplate({
            orderNumber: order.orderNumber,
            fullName: order.fullName,
            address,
            courierName: order.courierName,
            trackingUrl: order.trackingUrl,
            awbNumber: order.awbNumber,
            subTotalPrice: order.subTotalPrice,
            shippingFee: order.shippingFee,
            totalPrice: order.totalPrice,
            items: order.order_items ?? [],
          }),
        });

        const { error: updateError } = await supabase
          .from("orders")
          .update({ emailSent: true, orderWorkflowStatus: "email_sent" })
          .eq("id", order.id);

        if (updateError) {
          console.error(
            `Failed to update order ${order.orderNumber} after sending email:`,
            updateError
          );
          failedEmails.push({
            orderNumber: order.orderNumber,
            error: "Database update failed (email was sent)",
            details: updateError,
          });
        } else {
          processedCount++;
          console.log("Tracking email sent:", order.orderNumber);
        }
      } catch (emailError) {
        console.error(
          `Failed to send email for order ${order.orderNumber}:`,
          emailError
        );
        failedEmails.push({
          orderNumber: order.orderNumber,
          error: "Email sending failed",
          details:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      totalOrders: ordersToProcess.length,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
