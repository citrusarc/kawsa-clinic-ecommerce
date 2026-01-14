import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/utils/neon/client";
import { EasyParcelItem } from "@/types";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_PARCEL_STATUS_URL =
  process.env.EASYPARCEL_DEMO_PARCEL_STATUS_URL!;

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await sql`
      SELECT * FROM orders
      WHERE "orderWorkflowStatus" = 'payment_done_awb_pending'
    `;

    if (!orders?.length) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "No pending AWB orders",
      });
    }

    let updatedCount = 0;
    const failedOrders: { orderNumber: string; error: string }[] = [];

    for (const order of orders) {
      const orderNumber = String(order.orderNumber ?? "UNKNOWN");
      const easyparcelOrderNo = String(order.easyparcelOrderNumber ?? "");

      try {
        if (!easyparcelOrderNo.trim()) {
          failedOrders.push({
            orderNumber,
            error: "Missing EasyParcel order number",
          });
          continue;
        }

        const response = await fetch(EASYPARCEL_PARCEL_STATUS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api: EASYPARCEL_API_KEY,
            bulk: [{ order_no: easyparcelOrderNo }],
          }),
        });

        if (!response.ok) {
          failedOrders.push({
            orderNumber,
            error: `API error - HTTP ${response.status}`,
          });
          continue;
        }

        const result = await response.json();

        if (result?.api_status !== "Success") {
          failedOrders.push({
            orderNumber,
            error: result?.error_remark || "API failed",
          });
          continue;
        }

        const orderResult = result?.result?.[0];
        if (!orderResult || orderResult.status !== "Success") {
          failedOrders.push({ orderNumber, error: "Invalid response" });
          continue;
        }

        let parcelList = [];
        if (Array.isArray(orderResult.parcel)) {
          parcelList = orderResult.parcel;
        } else if (Array.isArray(orderResult.result)) {
          parcelList = orderResult.result;
        }

        if (parcelList.length === 0) continue;

        const parcelsWithAwb = parcelList.filter(
          (p: EasyParcelItem) =>
            p?.awb && p.awb.trim() !== "" && p?.parcel_number
        );

        if (parcelsWithAwb.length === 0) continue;

        const parcel = parcelsWithAwb[0];

        // // Update order using Neon SQL
        await sql`
          UPDATE orders
          SET "trackingNumber" = ${parcel.parcel_number},
              "trackingUrl" = ${parcel.tracking_url || null},
              "awbNumber" = ${parcel.awb},
              "awbPdfUrl" = ${parcel.awb_id_link || null},
              "orderWorkflowStatus" = 'awb_generated',
              "deliveryStatus" = ${parcel.ship_status || "ready_for_pickup"},
              "orderStatus" = 'processing'
          WHERE id = ${order.id}
        `;

        updatedCount++;
      } catch (orderErr) {
        const errorMessage =
          orderErr instanceof Error ? orderErr.message : String(orderErr);
        failedOrders.push({ orderNumber, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalOrders: orders.length,
      stillWaiting: orders.length - updatedCount - failedOrders.length,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Critical sync AWB error:", errorMessage);
    return NextResponse.json(
      { success: false, error: "Sync failed", details: errorMessage },
      { status: 500 }
    );
  }
}
