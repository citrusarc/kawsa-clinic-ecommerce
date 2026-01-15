import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/utils/neon/client";
import { transporter } from "@/utils/email";
import { emailSendConfirmationTemplate } from "@/utils/email/emailSendConfirmationTemplate";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("📩 CHIP webhook payload:", payload);

    const { id: chipPurchaseId, reference, status, transaction_data } = payload;

    if (!reference) {
      console.error("Missing reference in CHIP webhook");
      return NextResponse.json({ received: true });
    }

    const orderData = await sql`
      SELECT 
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'itemSrc', oi."itemSrc",
              'itemName', oi."itemName",
              'itemQuantity', oi."itemQuantity",
              'itemTotalPrice', oi."itemTotalPrice"
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON oi."orderId" = o.id
      WHERE o."orderNumber" = ${reference}
      GROUP BY o.id
    `;

    if (!orderData || orderData.length === 0) {
      console.error("Order not found for reference:", reference);
      return NextResponse.json({ received: true });
    }

    const order = orderData[0];

    if (
      order.paymentStatus === "paid" &&
      (order.orderWorkflowStatus === "payment_confirmed" ||
        order.easyparcelOrderNumber)
    ) {
      console.log("Webhook already processed, skipping:", reference);
      return NextResponse.json({ received: true });
    }

    switch (status) {
      case "paid": {
        await sql`
          UPDATE orders
          SET "chipPurchaseId" = ${chipPurchaseId},
              "paymentMethod" = ${
                transaction_data?.payment_method ||
                transaction_data?.attempts?.[0]?.payment_method ||
                order.paymentMethod ||
                null
              },
              "paymentStatus" = 'paid',
              "orderStatus" = 'processing',
              "orderWorkflowStatus" = 'payment_confirmed'
          WHERE id = ${order.id}
        `;

        try {
          await transporter.sendMail({
            from: `"Kawsa MD Formula" <${process.env.EMAIL_USER}>`,
            to: order.email,
            bcc: process.env.ADMIN_EMAIL
              ? process.env.ADMIN_EMAIL.split(",").map((e) => e.trim())
              : [],
            subject: `Order Confirmation - ${order.orderNumber}`,
            html: emailSendConfirmationTemplate({
              orderNumber: order.orderNumber,
              fullName: order.fullName,
              subTotalPrice: Number(order.subTotalPrice),
              shippingFee: Number(order.shippingFee),
              totalPrice: Number(order.totalPrice),
              items: order.order_items ?? [],
            }),
          });
          console.log("Order confirmation email sent:", order.orderNumber);
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }

        if (order.easyparcelOrderNumber) {
          console.log(
            "EasyParcel already created, skipping making-order:",
            reference
          );
          return NextResponse.json({ received: true });
        }

        try {
          const epResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/easyparcel/making-order`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id }),
            }
          );
          const epResult = await epResponse.json();
          if (!epResponse.ok || epResult?.error) {
            console.error("EasyParcel making-order failed:", epResult);
          } else {
            console.log(
              "EasyParcel making-order triggered successfully:",
              reference
            );
          }
        } catch (epError) {
          console.error(
            "Failed to trigger EasyParcel making-order:",
            reference,
            epError
          );
        }
        break;
      }

      case "error":
      case "cancelled":
      case "blocked": {
        if (order.paymentStatus !== "paid") {
          await sql`
            UPDATE orders
            SET "paymentStatus" = 'failed',
                "orderStatus" = 'cancelled_due_to_payment'
            WHERE id = ${order.id}
          `;
          console.log("Order marked as FAILED:", reference);
        }
        break;
      }

      case "created":
      case "viewed":
        console.log("CHIP status ignored:", status, reference);
        break;

      default:
        console.warn(`Unknown CHIP status '${status}' for order ${reference}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("🔥 CHIP webhook error:", err);
    return NextResponse.json({ received: true });
  }
}
