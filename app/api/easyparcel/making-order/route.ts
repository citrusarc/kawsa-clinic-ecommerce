import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_DEMO_MAKING_ORDER_URL =
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

    // Ensure payment is successful (CHIP)
    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
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
      (sum, index) => sum + Number(index.weight || 0),
      0
    );

    const parcelValue = items.reduce(
      (sum, index) => sum + Number(index.itemTotalPrice || 0),
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
          // Shipment details
          weight: totalWeight,
          content: "E-commerce Order",
          value: parcelValue,
          service_id: order.easyparcel_service_id,

          // Sender
          pick_name: "Your Shop Name",
          pick_contact: "0123456789",
          pick_addr1: "Your warehouse address",
          pick_city: "Shah Alam",
          pick_state: "Selangor",
          pick_code: "40170",
          pick_country: "MY",

          // Receiver
          send_name: order.fullName,
          send_contact: order.phoneNumber,
          send_email: order.email,
          send_addr1: order.addressLine1,
          send_addr2: order.addressLine2 || "",
          send_city: order.city,
          send_state: order.state,
          send_code: order.postcode,
          send_country: "MY",

          // Notifications & reference
          collect_date: new Date().toISOString().split("T")[0],
          sms: true,
          reference: order.orderNumber,
        },
      ],
    };

    // 5. Call EasyParcel Making-Order API
    const response = await fetch(EASYPARCEL_DEMO_MAKING_ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || result?.api_status !== "Success") {
      console.error("EasyParcel making-order error:", result);
      return NextResponse.json(
        { error: "EasyParcel making-order failed", detail: result },
        { status: 500 }
      );
    }

    const epOrder = result?.result?.[0];

    // 6. Save EasyParcel order info (needed for payment step)
    await supabase
      .from("orders")
      .update({
        courierName: epOrder.courier || "EasyParcel",
        parcelNumber: epOrder.parcel_number, // //
        easyparcelOrderNo: epOrder.order_number, // //
        deliveryStatus: "processing",
      })
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      parcelNumber: epOrder.parcel_number,
      easyparcelOrderNo: epOrder.order_number, // //
    });
  } catch (err) {
    console.error("EasyParcel making-order error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
