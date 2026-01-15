export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/utils/neon/client";
import { transporter } from "@/utils/email";
import { emailSendTrackingTemplate } from "@/utils/email/emailSendTrackingTemplate";
import { emailSendOrderTemplate } from "@/utils/email/emailSendOrderTemplate";
import { generatePickOrderPdf } from "@/utils/email/generatePickOrderPdf";
import type { OrderSuccessBody, EmailAttachment } from "@/types";

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

    let ordersToProcess: OrderSuccessBody[] = [];

    if (mode === "cron") {
      const orders = await sql`
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
        WHERE o."paymentStatus" = 'paid'
          AND o."awbNumber" IS NOT NULL
          AND o."orderWorkflowStatus" = 'awb_generated'
          AND o."emailSent" = false
        GROUP BY o.id
      `;

      console.log(
        `Found ${
          orders?.length || 0
        } orders ready for email tracking and email order`
      );
      ordersToProcess = (orders ?? []) as OrderSuccessBody[];
    } else {
      if (!orderNumber) {
        return NextResponse.json(
          { error: "Missing orderNumber" },
          { status: 400 }
        );
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
        WHERE o."orderNumber" = ${orderNumber}
        GROUP BY o.id
      `;

      if (!orderData || orderData.length === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      ordersToProcess = [orderData[0] as OrderSuccessBody];
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
          from: `"Kawsa MD Formula" <${process.env.EMAIL_USER}>`,
          to: order.email,
          bcc: process.env.ADMIN_EMAIL
            ? process.env.ADMIN_EMAIL.split(",").map((e) => e.trim())
            : [],
          subject: `Your order ${order.orderNumber} is on the way 🚚`,
          html: emailSendTrackingTemplate({
            orderNumber: order.orderNumber,
            fullName: order.fullName,
            address,
            courierName: order.courierName,
            trackingUrl: order.trackingUrl,
            awbNumber: order.awbNumber,
            subTotalPrice: Number(order.subTotalPrice),
            shippingFee: Number(order.shippingFee),
            totalPrice: Number(order.totalPrice),
            items: order.order_items ?? [],
          }),
        });

        const formattedCreatedAt = order.createdAt
          ? new Date(order.createdAt).toLocaleString("en-MY", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A";

        const attachments: EmailAttachment[] = [];

        if (order.awbPdfUrl && order.awbPdfUrl !== "#") {
          try {
            const awbResponse = await fetch(order.awbPdfUrl);
            if (awbResponse.ok) {
              const awbBuffer = await awbResponse.arrayBuffer();
              attachments.push({
                filename: `AWB_${order.orderNumber}.pdf`,
                content: Buffer.from(awbBuffer),
                contentType: "application/pdf",
              });
            }
          } catch (awbError) {
            console.error(
              `Failed to fetch AWB PDF for ${order.orderNumber}:`,
              awbError
            );
          }
        }

        try {
          const pickOrderPdf = await generatePickOrderPdf({
            orderNumber: order.orderNumber,
            createdAt: formattedCreatedAt,
            fullName: order.fullName,
            awbNumber: order.awbNumber,
            items: (order.order_items ?? []).map((item) => ({
              itemName: item.itemName,
              itemQuantity: item.itemQuantity,
            })),
          });

          attachments.push({
            filename: `PICK_ORDER_${order.orderNumber || "UNKNOWN"}.pdf`,
            content: pickOrderPdf,
            contentType: "application/pdf",
          });
        } catch (pdfError) {
          console.error(
            `Failed to generate Pick Order PDF for ${order.orderNumber}:`,
            pdfError
          );
        }

        await transporter.sendMail({
          from: `"Kawsa MD Formula" <${process.env.EMAIL_USER}>`,
          to: "citrusarc.studio@gmail.com", // //
          subject: `New Order Received - ${order.orderNumber}`,
          html: emailSendOrderTemplate({
            orderNumber: order.orderNumber,
            createdAt: formattedCreatedAt,
            fullName: order.fullName,
            email: order.email,
            phoneNumber: order.phoneNumber,
            address,
            courierName: order.courierName,
            awbNumber: order.awbNumber,
            trackingUrl: order.trackingUrl,
            awbPdfUrl: order.awbPdfUrl || "#",
            subTotalPrice: order.subTotalPrice,
            shippingFee: order.shippingFee,
            totalPrice: order.totalPrice,
            items: order.order_items ?? [],
          }),
          attachments,
        });

        await sql`
          UPDATE orders
          SET "emailSent" = true,
              "orderWorkflowStatus" = 'email_sent'
          WHERE id = ${order.id}
        `;

        processedCount++;
        console.log(
          `Tracking email sent to customer and order details sent to admin for order: ${order.orderNumber}`
        );
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
