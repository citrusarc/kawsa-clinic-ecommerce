import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASY_PARCEL_URL = process.env.EASYPARCEL_API_URL!; // // demo or live
const EASY_PARCEL_API_KEY = process.env.EASYPARCEL_API_KEY!; // //

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json(); // //

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // // 1. Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // // Ensure payment is successful
    if (order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // // 2. Get order items
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

    // // 3. Calculate parcel info
    const totalWeight = items.reduce(
      (sum, i) => sum + Number(i.weight || 0),
      0
    );

    const parcelValue = items.reduce(
      (sum, i) => sum + Number(i.itemTotalPrice || 0),
      0
    );

    // // 4. Build EasyParcel payload
    const payload = {
      api: EASY_PARCEL_API_KEY, // //
      bulk: [
        {
          weight: totalWeight,
          content: "E-commerce Order",
          value: parcelValue,
          service_id: order.easyparcel_service_id, // // must be saved earlier

          // // Sender (Your shop)
          pick_name: "Your Shop Name",
          pick_contact: "0123456789",
          pick_addr1: "Your warehouse address",
          pick_city: "Shah Alam",
          pick_state: "Selangor",
          pick_code: "40170",
          pick_country: "MY",

          // // Receiver
          send_name: order.fullName,
          send_contact: order.phoneNumber,
          send_email: order.email,
          send_addr1: order.address,
          send_city: order.city,
          send_state: order.state,
          send_code: order.postcode,
          send_country: "MY",

          collect_date: new Date().toISOString().split("T")[0], // //
          sms: true,
          reference: order.orderNumber, // //
        },
      ],
    };

    // // 5. Call EasyParcel
    const response = await fetch(EASY_PARCEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || result?.error) {
      console.error("EasyParcel error:", result);
      return NextResponse.json(
        { error: "EasyParcel order failed" },
        { status: 500 }
      );
    }

    const epOrder = result?.result?.[0]; // //

    // // 6. Update order with tracking info
    await supabase
      .from("orders")
      .update({
        courierName: epOrder?.courier_name || "EasyParcel",
        trackingNumber: epOrder?.tracking_number || null,
        deliveryStatus: "processing",
      })
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      trackingNumber: epOrder?.tracking_number,
      courier: epOrder?.courier_name,
    });
  } catch (err) {
    console.error("EasyParcel making order error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
