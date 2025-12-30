import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_MAKING_ORDER_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, mode } = body;

    if (mode === "cron") {
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let ordersToProcess = [];

    if (mode === "cron") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("paymentStatus", "paid")
        .in("orderWorkflowStatus", [
          "pending_easyparcel_order",
          "payment_confirmed",
        ])
        .is("easyparcelOrderNumber", null);
      if (error) throw error;
      ordersToProcess = orders;
    } else {
      if (!orderId) {
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }

      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !order)
        return NextResponse.json({ error: "Order not found" }, { status: 404 });

      ordersToProcess = [order];
    }

    for (const order of ordersToProcess) {
      if (!order.serviceId) continue;

      if (
        !["pending_easyparcel_order", "payment_confirmed"].includes(
          order.orderWorkflowStatus
        )
      )
        continue;

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("orderId", order.id);

      if (!items || items.length === 0) continue;

      const totalWeight = Number(
        items
          .reduce(
            (sum, item) =>
              sum +
              Number(item.itemWeight || 0) * Number(item.itemQuantity || 1),
            0
          )
          .toFixed(2)
      );

      if (totalWeight <= 0) continue;

      const payload = {
        api: EASYPARCEL_API_KEY,
        bulk: [
          {
            weight: totalWeight,
            width: Math.max(...items.map((i) => Math.ceil(i.itemWidth || 0))),
            length: Math.max(...items.map((i) => Math.ceil(i.itemLength || 0))),
            height: Math.max(...items.map((i) => Math.ceil(i.itemHeight || 0))),
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
            send_email: order.email,
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

      const response = await fetch(EASYPARCEL_MAKING_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || result?.api_status !== "Success") continue;

      const epOrder = result?.result?.[0];
      if (!epOrder?.order_number) continue;

      await supabase
        .from("orders")
        .update({
          easyparcelOrderNumber: epOrder.order_number,
          courierName: epOrder.courier_name || order.courierName,
          orderWorkflowStatus: "easyparcel_order_created",
          orderStatus: "processing",
        })
        .eq("id", order.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("EasyParcel making-order error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
