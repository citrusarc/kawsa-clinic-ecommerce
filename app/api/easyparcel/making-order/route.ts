import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_MAKING_ORDER_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_URL!;

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // 1. Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    if (!order.serviceId) {
      return NextResponse.json(
        { error: "Missing EasyParcel serviceId" },
        { status: 400 }
      );
    }

    if (order.easyparcelOrderNo && order.deliveryStatus === "processing") {
      return NextResponse.json({ skipped: true });
    }

    // 2. Get order items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("orderId", orderId);

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Order items not found" },
        { status: 400 }
      );
    }

    // 3. Calculate parcel info
    const totalWeight = items.reduce(
      (sum, item) => sum + Number(item.itemWeight || 0),
      0
    );
    const maxWidth = items.reduce(
      (max, item) => Math.max(max, Number(item.itemWidth || 0)),
      0
    );
    const maxLength = items.reduce(
      (max, item) => Math.max(max, Number(item.itemLength || 0)),
      0
    );
    const maxHeight = items.reduce(
      (max, item) => Math.max(max, Number(item.itemHeight || 0)),
      0
    );
    const parcelValue = items.reduce(
      (sum, item) => sum + Number(item.itemTotalPrice || 0),
      0
    );

    if (totalWeight <= 0) {
      return NextResponse.json(
        { error: "Invalid parcel weight" },
        { status: 400 }
      );
    }

    // 4. Build EasyParcel Making-Order payload (DOC COMPLIANT)
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
          send_code: order.postcode,
          send_country: "MY",

          collect_date: new Date().toISOString().split("T")[0],
          sms: true,
          reference: order.orderNumber,
        },
      ],
    };

    // 5. Call EasyParcel Making-Order API
    const response = await fetch(EASYPARCEL_MAKING_ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "EasyParcel HTTP error", detail: result },
        { status: 500 }
      );
    }

    if (result?.api_status !== "Success") {
      console.error("EasyParcel API status error:", result);
      return NextResponse.json(
        { error: "EasyParcel API failed", detail: result },
        { status: 500 }
      );
    }

    const epOrder = result?.result?.[0];

    if (!epOrder || !epOrder.order_number) {
      console.error("EasyParcel invalid response:", result);
      return NextResponse.json(
        { error: "EasyParcel invalid response", detail: result },
        { status: 500 }
      );
    }

    // 6. Save EasyParcel order info
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        easyparcelOrderNo: epOrder.order_number,
        courierName: epOrder.courier_name || order.courierName,
        trackingNumber: null,
        deliveryStatus: "processing",
        orderStatus: "processing",
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      easyparcelOrderNo: epOrder.order_number,
      trackingNumber: epOrder.parcel_number,
    });
  } catch (err) {
    console.error("EasyParcel making-order error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
