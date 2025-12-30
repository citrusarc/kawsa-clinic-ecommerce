import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { transporter } from "@/utils/email";
import { orderEmailConfirmationTemplate } from "@/utils/email/orderEmailConfirmationTemplate";
import type {
  OrderSuccessBody,
  OrderEmailConfirmationTemplateProps,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, mode } = body;

    if (mode === "cron") {
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let ordersToProcess: OrderSuccessBody[] = [];

    if (mode === "cron") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          `
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
        `
        )
        .eq("paymentStatus", "paid")
        .not("awbNumber", "is", null)
        .eq("orderWorkflowStatus", "awb_generated")
        .eq("emailSent", false);

      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }

      // // Added logging for debugging
      console.log(
        `Found ${orders?.length || 0} orders ready for email confirmation`
      );
      ordersToProcess = (orders ?? []) as OrderSuccessBody[];
    } else {
      if (!orderNumber)
        return NextResponse.json(
          { error: "Missing orderNumber" },
          { status: 400 }
        );

      const { data: order, error } = await supabase
        .from("orders")
        .select(
          `
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
        `
        )
        .eq("orderNumber", orderNumber)
        .single();

      if (error || !order)
        return NextResponse.json({ error: "Order not found" }, { status: 404 });

      ordersToProcess = [order as OrderSuccessBody];
    }

    let processedCount = 0;
    let failedEmails = [];

    for (const order of ordersToProcess) {
      // // Added detailed logging
      console.log(
        `Processing email for order ${order.orderNumber} (ID: ${order.id})`
      );
      console.log(
        `Order workflow status: ${order.orderWorkflowStatus}, emailSent: ${order.emailSent}, AWB: ${order.awbNumber}`
      );

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

      // // Added validation for required email fields
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

      // // Added try-catch for email template generation
      let html;
      try {
        html = orderEmailConfirmationTemplate({
          orderId: order.id,
          orderNumber: order.orderNumber,
          fullName: order.fullName,
          email: order.email,
          phoneNumber: order.phoneNumber,
          address,
          paymentMethod: order.paymentMethod,
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
      } catch (templateError) {
        console.error(
          `Failed to generate email template for order ${order.orderNumber}:`,
          templateError
        );
        failedEmails.push({
          orderNumber: order.orderNumber,
          error: "Template generation failed",
          details:
            templateError instanceof Error
              ? templateError.message
              : String(templateError),
        });
        continue;
      }

      // // Added better error handling for email sending
      try {
        console.log(
          `Sending email to ${order.email} for order ${order.orderNumber}`
        );

        const info = await transporter.sendMail({
          from: `"Kawsa Clinic" <${process.env.EMAIL_USER}>`,
          to: order.email,
          subject: `Your order ${order.orderNumber} is on the way 🚚`,
          html,
        });

        console.log(`Email sent to ${order.email}:`, info.messageId);

        // // Update database with better error handling
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
          console.log(
            `Successfully processed email for order ${order.orderNumber}`
          );
          processedCount++;
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

    // // Return detailed response
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
