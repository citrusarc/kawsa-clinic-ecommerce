import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/utils/neon/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_MAKING_ORDER_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const orderData = await sql`
      SELECT * FROM orders
      WHERE id = ${orderId}
    `;

    if (!orderData || orderData.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderData[0];

    if (!order.serviceId) {
      return NextResponse.json({ error: "Missing serviceId" }, { status: 400 });
    }

    if (
      !["pending_easyparcel_order", "payment_confirmed"].includes(
        order.orderWorkflowStatus
      )
    ) {
      return NextResponse.json(
        { error: "Invalid workflow status" },
        { status: 400 }
      );
    }

    const items = await sql`
      SELECT * FROM order_items
      WHERE "orderId" = ${order.id}
    `;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No order items found" },
        { status: 400 }
      );
    }

    const totalWeight = items.reduce(
      (sum, item) =>
        sum + Number(item.itemWeight || 0) * Number(item.itemQuantity || 1),
      0
    );

    if (totalWeight <= 0) {
      return NextResponse.json(
        { error: "Invalid total weight" },
        { status: 400 }
      );
    }

    const payload = {
      api: EASYPARCEL_API_KEY,
      bulk: [
        {
          weight: totalWeight,
          width: Math.max(
            ...items.map((i) => Math.ceil(Number(i.itemWidth) || 1))
          ),
          length: Math.max(
            ...items.map((i) => Math.ceil(Number(i.itemLength) || 1))
          ),
          height: Math.max(
            ...items.map((i) => Math.ceil(Number(i.itemHeight) || 1))
          ),
          content: "skincare",
          value: items.reduce(
            (sum, item) => sum + Number(item.itemTotalPrice || 0),
            0
          ),
          service_id: order.serviceId,
          pick_name: "DRKAY MEDIBEAUTY SDN BHD",
          pick_contact: "+60123456789",
          pick_addr1: "39-02, Jalan Padi Emas 1/8",
          pick_city: "Johor Bahru",
          pick_state: "Johor",
          pick_code: "81200",
          pick_country: "MY",
          send_name: order.fullName,
          send_contact: order.phoneNumber,
          send_email: "citrusarc.studio@gmail.com",
          send_addr1: order.addressLine1,
          send_addr2: order.addressLine2 || "",
          send_city: order.city,
          send_state: order.state,
          send_code: String(order.postcode),
          send_country: "MY",
          collect_date: new Date().toISOString().split("T")[0],
          sms: true,
          reference: String(order.orderNumber),
        },
      ],
    };

    let response;
    let result;
    try {
      response = await fetch(EASYPARCEL_MAKING_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      result = await response.json();
    } catch (fetchError) {
      console.error(`Fetch error for order ${order.orderNumber}:`, fetchError);
      return NextResponse.json(
        { error: "Fetch failed", details: String(fetchError) },
        { status: 500 }
      );
    }

    if (!response.ok || result?.api_status !== "Success") {
      console.error(
        `EasyParcel API error for order ${order.orderNumber}:`,
        result
      );
      return NextResponse.json(
        { error: "EasyParcel API error", details: result },
        { status: 500 }
      );
    }

    const epOrder = result?.result?.[0];
    if (!epOrder?.order_number) {
      console.error(`No order_number for ${order.orderNumber}`);
      return NextResponse.json(
        { error: "No order_number in response" },
        { status: 500 }
      );
    }

    await sql`
      UPDATE orders
      SET "easyparcelOrderNumber" = ${epOrder.order_number},
          "courierName" = ${epOrder.courier_name || order.courierName},
          "orderWorkflowStatus" = 'easyparcel_order_created',
          "orderStatus" = 'processing'
      WHERE id = ${order.id}
    `;

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      easyparcelOrderNumber: epOrder.order_number,
    });
  } catch (err) {
    console.error("EasyParcel making-order error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
