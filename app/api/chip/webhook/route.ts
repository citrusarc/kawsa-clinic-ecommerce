import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("CHIP Webhook Received:", payload);

    const { id: chipPurchaseId, reference, status } = payload;

    if (!reference) {
      console.error("Missing CHIP reference");
      return NextResponse.json(
        { error: "Missing order reference" },
        { status: 400 }
      );
    }

    // 1. Find order by orderNumber
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("orderNumber", reference)
      .single();

    if (findError || !order) {
      console.error("Order not found for reference:", reference);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Handle payment statuses
    if (status === "paid") {
      console.log("Payment successful, updating order...");

      await supabase
        .from("orders")
        .update({
          paymentMethod:
            payload.transaction_data?.payment_method ||
            payload.transaction_data?.attempts?.[0]?.payment_method ||
            null,
          paymentStatus: "paid",
          orderStatus: "processing",
          chipPurchaseId,
        })
        .eq("id", order.id);

      if (!order.easyparcelOrderNo) {
        try {
          const createOrderRes = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/easyparcel/making-order`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id }),
            }
          );

          const createOrderData = await createOrderRes.json();

          if (!createOrderRes.ok) {
            console.error("EasyParcel making-order failed:", createOrderData);
            return NextResponse.json({ received: true });
          }
        } catch (err) {
          console.error("EasyParcel making-order error:", err);
          return NextResponse.json({ received: true });
        }
      } else {
        console.log("EasyParcel order already exists, skipping making-order");
      }

      if (!order.trackingNumber) {
        try {
          const payOrderRes = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/easyparcel/making-order-payment`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id }),
            }
          );

          const payOrderData = await payOrderRes.json();

          if (!payOrderRes.ok) {
            console.error(
              "EasyParcel making-order-payment failed:",
              payOrderData
            );
          }
        } catch (err) {
          console.error("EasyParcel making-order-payment error:", err);
        }
      } else {
        console.log("AWB already exists, skipping payment");
      }
    } else if (status === "failed" || status === "cancelled") {
      console.log("Payment failed/cancelled, updating order...");

      await supabase
        .from("orders")
        .update({
          paymentStatus: "failed",
          orderStatus: "cancelled_due_to_payment",
        })
        .eq("id", order.id);
    } else if (status === "pending") {
      console.log("Payment still pending...");

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
