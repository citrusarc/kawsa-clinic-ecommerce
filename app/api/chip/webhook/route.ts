import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const { id: chipPurchaseId, orderNumber, status } = payload;

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Missing order number" },
        { status: 400 }
      );
    }

    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("orderNumber", orderNumber)
      .single();

    if (findError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (status === "paid") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          chipPurchaseId,
          paymentMethod:
            payload.transaction_data?.payment_method ||
            payload.transaction_data?.attempts?.[0]?.payment_method ||
            null,
          paymentStatus: "paid",
          orderStatus: "processing",
        })
        .eq("id", order.id);

      if (updateError) {
        console.error("Failed to update paid order:", updateError); // //
        return NextResponse.json({ received: true }); // //
      }

      // // 🔍 Trigger EasyParcel ONLY after paid
      console.log("Trigger EasyParcel making-order:", order.id); // //
      console.log("🚀 CALLING EASY PARCEL", {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus, // //
      }); // //

      const makingOrderRes = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/easyparcel/making-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        }
      );

      const makingOrderData = await makingOrderRes.json(); // //
      console.log("making-order result:", makingOrderData); // //

      // // ⛔ DO NOT call making-order-payment here
      // // EasyParcel payment should be triggered ONLY after order creation success
    }

    // // ⛔ FAILED / CANCELLED — only if NOT paid yet
    if (status === "failed" || status === "cancelled") {
      console.log("Payment failed/cancelled"); // //

      await supabase
        .from("orders")
        .update({
          paymentStatus: "failed",
          orderStatus: "cancelled_due_to_payment",
        })
        .eq("id", order.id);
    }

    // // ⛔ PENDING — only before paid
    if (status === "pending" && order.paymentStatus !== "paid") {
      await supabase
        .from("orders")
        .update({
          paymentStatus: "pending",
          orderStatus: "awaiting_payment",
        })
        .eq("id", order.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
