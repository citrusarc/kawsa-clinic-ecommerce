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
      console.error("Order not found:", orderNumber);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    switch (status) {
      case "paid":
        const { error: updatePaidError } = await supabase
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

        // // START
        if (updatePaidError) {
          console.error("Failed to update paid order:", updatePaidError);
        } else {
          // // Optional: Trigger EasyParcel only after payment is confirmed
          // console.log("Trigger EasyParcel making-order:", order.id); // //
        }
        break;

      // // 🔍 Trigger EasyParcel ONLY after paid
      // console.log("Trigger EasyParcel making-order:", order.id); // //
      // console.log("🚀 CALLING EASY PARCEL", {
      //   orderId: order.id,
      //   paymentStatus: order.paymentStatus,
      //   deliveryStatus: order.deliveryStatus, // //
      // }); // //

      // const makingOrderRes = await fetch(
      //   `${process.env.NEXT_PUBLIC_SITE_URL}/api/easyparcel/making-order`,
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ orderId: order.id }),
      //   }
      // );

      // const makingOrderData = await makingOrderRes.json(); // //
      // console.log("making-order result:", makingOrderData); // //

      // // END

      case "error":
      case "cancelled":
        await supabase
          .from("orders")
          .update({
            paymentStatus: "failed",
            orderStatus: "cancelled_due_to_payment",
          })
          .eq("id", order.id);
        break;

      case "viewed":
        if (order.paymentStatus === "pending") {
          await supabase
            .from("orders")
            .update({
              paymentStatus: "pending",
              orderStatus: "awaiting_payment",
            })
            .eq("id", order.id);
        }
        break;

      case "created":
      case "sent":
      case "overdue":
      case "expired":
      case "blocked":
      case "hold":
      case "released":
      case "pending_release":
      case "pending_capture":
      case "preauthorized":
      case "pending_execute":
      case "pending_charge":
      case "cleared":
      case "settled":
      case "chargeback":
      case "pending_refund":
      case "refunded":
        console.log(
          `CHIP webhook received status '${status}' for order ${orderNumber}`
        );
        break;

      default:
        console.warn(
          `Unknown CHIP status '${status}' for order ${orderNumber}`
        );
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
