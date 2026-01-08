export const runtime = "nodejs"; // //
export const dynamic = "force-dynamic"; // //

import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { supabase } from "@/utils/supabase/client";
import { transporter } from "@/utils/email";
import { emailSendTrackingTemplate } from "@/utils/email/emailSendTrackingTemplate";
import {
  emailSendOrderTemplate,
  generatePickupPdfHtml,
} from "@/utils/email/emailSendOrderTemplate";
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

      if (error) throw error;
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
      if (
        order.orderWorkflowStatus !== "awb_generated" ||
        order.emailSent ||
        !order.awbNumber ||
        !order.email
      ) {
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
        // ================= CUSTOMER EMAIL =================
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

        const attachments: EmailAttachment[] = [];

        // ================= AWB PDF =================
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
          } catch {}
        }

        // ================= PICKUP PDF =================
        let browser;
        try {
          const isProduction = process.env.NODE_ENV === "production";

          browser = await puppeteer.launch({
            args: isProduction
              ? chromium.args // //
              : ["--no-sandbox", "--disable-setuid-sandbox"],

            executablePath: isProduction
              ? await chromium.executablePath() // //
              : process.platform === "win32"
              ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
              : process.platform === "darwin"
              ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
              : "/usr/bin/google-chrome",

            headless: true, // // FIX: always use Puppeteer headless
          });

          const page = await browser.newPage();
          await page.setViewport({ width: 794, height: 1123 }); // //

          const pickupHtml = generatePickupPdfHtml({
            orderNumber: order.orderNumber,
            createdAt: formattedCreatedAt,
            fullName: order.fullName,
            awbNumber: order.awbNumber,
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
        } finally {
          if (browser) {
            try {
              await browser.close();
            } catch {}
          }
        }

        // ================= ADMIN EMAIL =================
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

        await supabase
          .from("orders")
          .update({ emailSent: true, orderWorkflowStatus: "email_sent" })
          .eq("id", order.id);

        processedCount++;
      } catch (emailError) {
        failedEmails.push({
          orderNumber: order.orderNumber,
          error:
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
      failedEmails: failedEmails.length ? failedEmails : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
