import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/utils/neon/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");

  if (!orderNumber) {
    return NextResponse.json(
      { error: "Missing order number" },
      { status: 400 }
    );
  }

  const data = await sql`
    SELECT 
      o.id,
      o."easyparcelOrderNumber",
      o."orderNumber",
      o."subTotalPrice",
      o."shippingFee",
      o."totalPrice",
      o."courierName",
      o."trackingNumber",
      o."trackingUrl",
      o."awbNumber",
      o."awbPdfUrl",
      o."deliveryStatus",
      json_agg(
        json_build_object(
          'id', oi.id,
          'itemSrc', oi."itemSrc",
          'itemName', oi."itemName",
          'itemQuantity', oi."itemQuantity",
          'itemTotalPrice', oi."itemTotalPrice"
        )
      ) as order_items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi."orderId"
    WHERE o."orderNumber" = ${orderNumber}
    GROUP BY o.id
  `;

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(data[0]);
}
