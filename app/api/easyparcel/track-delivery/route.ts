import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/utils/neon/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_PARCEL_STATUS_URL =
  process.env.EASYPARCEL_DEMO_PARCEL_STATUS_URL!;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return POST(req);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await sql`
      SELECT * FROM orders
      WHERE "easyparcelOrderNumber" IS NOT NULL
        AND "deliveryStatus" NOT IN ('Successfully Delivered', 'Cancel', 'Cancel By Admin', 'Returned')
        AND "orderWorkflowStatus" IN ('awb_generated', 'email_sent')
    `;

    if (!orders?.length) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "No orders to track",
      });
    }

    console.log(`Tracking ${orders.length} orders for delivery updates`);
   
    const bulkPayload = {
      api: EASYPARCEL_API_KEY,
      bulk: orders.map((order) => ({
        order_no: order.easyparcelOrderNumber,
      })),
    };

    let response;
    let result;
    try {
      response = await fetch(EASYPARCEL_PARCEL_STATUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bulkPayload),
      });
      result = await response.json();
    } catch (fetchError) {
      console.error("Tracking API fetch error:", fetchError);
      return NextResponse.json(
        { error: "Tracking API fetch failed", details: String(fetchError) },
        { status: 500 }
      );
    }

    if (!response.ok || result?.api_status !== "Success") {
      console.error("Tracking API error:", result);
      return NextResponse.json(
        { error: "Tracking API failed", details: result },
        { status: 500 }
      );
    }

    let updatedCount = 0;
    const failedOrders = [];
    const deliveredOrders = [];
 
    for (const trackingResult of result.result || []) {
      try {
        if (trackingResult.status !== "Success") {
          failedOrders.push({
            orderNumber: trackingResult.order_no,
            error: trackingResult.remarks || "Tracking failed",
          });
          continue;
        }

        const parcelList = trackingResult.parcel || [];
        if (parcelList.length === 0) continue;

        const parcel = parcelList[0];
        const shipStatus = parcel.ship_status;

        const order = orders.find(
          (o) => o.easyparcelOrderNumber === trackingResult.order_no
        );

        if (!order) continue;
    
        if (order.deliveryStatus !== shipStatus) {
          await sql`
            UPDATE orders
            SET "deliveryStatus" = ${shipStatus},
                "updatedAt" = NOW()
            WHERE id = ${order.id}
          `;

          updatedCount++;

          if (shipStatus === "Successfully Delivered") {
            deliveredOrders.push({
              orderNumber: order.orderNumber,
              email: order.email,
              fullName: order.fullName,
            });
          }

          console.log(
            `Order ${order.orderNumber}: ${order.deliveryStatus} → ${shipStatus}`
          );
        }
      } catch (orderErr) {
        const errorMessage =
          orderErr instanceof Error ? orderErr.message : String(orderErr);
        failedOrders.push({
          orderNumber: trackingResult.order_no || "UNKNOWN",
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalOrders: orders.length,
      deliveredOrders:
        deliveredOrders.length > 0 ? deliveredOrders : undefined,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Critical tracking error:", errorMessage);
    return NextResponse.json(
      { success: false, error: "Tracking failed", details: errorMessage },
      { status: 500 }
    );
  }
}