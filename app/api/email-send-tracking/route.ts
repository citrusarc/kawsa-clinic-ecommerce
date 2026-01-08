import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

import { supabase } from "@/utils/supabase/client";
import { transporter } from "@/utils/email";
import { emailSendTrackingTemplate } from "@/utils/email/emailSendTrackingTemplate";
import {
  emailSendOrderTemplate,
  generatePickupPdfHtml,
} from "@/utils/email/emailSendOrderTemplate";
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
      awbPdfUrl,
      subTotalPrice,
      shippingFee,
      totalPrice,
      deliveryStatus,
      orderStatus,
      emailSent,
      orderWorkflowStatus,
      order_items (*),
      createdAt
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
            subTotalPrice: order.subTotalPrice,
            shippingFee: order.shippingFee,
            totalPrice: order.totalPrice,
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

        const attachments: any[] = [];

        // 1. Fetch AWB PDF from URL if available
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

        // 2. Generate Pickup PDF
        try {
          const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });
          const page = await browser.newPage();

          const pickupHtml = generatePickupPdfHtml({
            orderNumber: order.orderNumber,
            createdAt: formattedCreatedAt,
            fullName: order.fullName,
            awbNumber: order.awbNumber || "N/A",
            items: (order.order_items ?? []).map((item) => ({
              itemName: item.itemName,
              itemQuantity: item.itemQuantity,
            })),
          });

          await page.setContent(pickupHtml, { waitUntil: "networkidle0" });
          const pickupPdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
              top: "20mm",
              right: "20mm",
              bottom: "20mm",
              left: "20mm",
            },
          });

          await browser.close();

          attachments.push({
            filename: `Pickup_${order.orderNumber}.pdf`,
            content: pickupPdfBuffer,
            contentType: "application/pdf",
          });
        } catch (pdfError) {
          console.error(
            `Failed to generate pickup PDF for ${order.orderNumber}:`,
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

        const { error: updateError } = await supabase
          .from("orders")
          .update({ emailSent: true, orderWorkflowStatus: "email_sent" })
          .eq("id", order.id);

        if (updateError) {
          console.error(
            `Tracking email sent to customer and order details sent to admin for order: ${order.orderNumber}`,
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
