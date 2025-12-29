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

    // // Modified: fetch multiple orders for cron mode with processing lock and batch limit
    let ordersToProcess = [];
    if (mode === "cron") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("paymentStatus", "paid")
        .is("easyparcelOrderNumber", null)
        .eq("processing", false) // only pick unprocessed
        .limit(10); // batch size
      if (error) throw error;
      ordersToProcess = orders;
    } else {
      if (!orderId) {
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (orderError || !order)
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      ordersToProcess = [order];
    }

    for (const order of ordersToProcess) {
      if (!order.serviceId) continue;

      // // Modified: set processing lock before doing API call
      await supabase
        .from("orders")
        .update({ processing: true, orderStatus: "processing" })
        .eq("id", order.id);

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("orderId", order.id);

      if (!items || items.length === 0) {
        await supabase
          .from("orders")
          .update({ processing: false })
          .eq("id", order.id);
        continue;
      }

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
      const maxWidth = items.reduce(
        (max, item) => Math.max(max, Math.ceil(Number(item.itemWidth || 0))),
        0
      );
      const maxLength = items.reduce(
        (max, item) => Math.max(max, Math.ceil(Number(item.itemLength || 0))),
        0
      );
      const maxHeight = items.reduce(
        (max, item) => Math.max(max, Math.ceil(Number(item.itemHeight || 0))),
        0
      );
      const parcelValue = items.reduce(
        (sum, item) => sum + Number(item.itemTotalPrice || 0),
        0
      );

      if (totalWeight <= 0) {
        await supabase
          .from("orders")
          .update({ processing: false })
          .eq("id", order.id);
        continue;
      }

      const payload = {
        api: EASYPARCEL_API_KEY,
        bulk: [
          {
            weight: totalWeight,
            width: maxWidth,
            length: maxLength,
            height: maxHeight,
            content: "skincare",
            value: parcelValue,
            service_id: order.serviceId,
            pick_name: "DRKAY MEDIBEAUTY SDN BHD",
            pick_contact: "+60123456789",
            pick_addr1: "39-02, Jalan Padi Emas 1/8",
            pick_addr2: "Bandar Baru Uda",
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

      if (!response.ok || result?.api_status !== "Success") {
        await supabase
          .from("orders")
          .update({ processing: false })
          .eq("id", order.id);
        continue;
      }

      const epOrder = result?.result?.[0];
      if (!epOrder?.order_number) {
        await supabase
          .from("orders")
          .update({ processing: false })
          .eq("id", order.id);
        continue;
      }

      await supabase
        .from("orders")
        .update({
          easyparcelOrderNumber: epOrder.order_number,
          courierName: epOrder.courier_name || order.courierName,
          trackingNumber: null,
          deliveryStatus: "processing",
          orderStatus: "created",
          processing: false, // release lock
        })
        .eq("id", order.id);
    }

    return NextResponse.json({
      success: true,
      processedOrders: ordersToProcess.length,
    });
  } catch (err) {
    console.error("EasyParcel making-order error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
