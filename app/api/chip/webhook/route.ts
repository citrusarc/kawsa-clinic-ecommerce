import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("📩 CHIP webhook payload:", payload);

    const { id: chipPurchaseId, reference, status, transaction_data } = payload;

    if (!reference) {
      console.error("Missing reference in CHIP webhook");
      return NextResponse.json({ received: true });
    }

    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("orderNumber", reference)
      .single();

    if (findError || !order) {
      console.error("Order not found for reference:", reference);
      return NextResponse.json({ received: true });
    }

    if (
      order.paymentStatus === "paid" &&
      (order.orderWorkflowStatus === "payment_confirmed" ||
        order.easyparcelOrderNumber)
    ) {
      console.log("Webhook already processed, skipping:", reference);
      return NextResponse.json({ received: true });
    }

    switch (status) {
      case "paid": {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            chipPurchaseId,
            paymentMethod:
              transaction_data?.payment_method ||
              transaction_data?.attempts?.[0]?.payment_method ||
              order.paymentMethod ||
              null,
            paymentStatus: "paid",
            orderStatus: "processing",
            orderWorkflowStatus: "payment_confirmed",
          })
          .eq("id", order.id);

        if (updateError) {
          console.error("Failed to update PAID order:", updateError);
          return NextResponse.json({ received: true });
        }

        if (order.easyparcelOrderNumber) {
          console.log(
            "EasyParcel already created, skipping making-order:",
            reference
          );
          return NextResponse.json({ received: true });
        }

        try {
          const epResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/easyparcel/making-order`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id }),
            }
          );

          const epResult = await epResponse.json();

          if (!epResponse.ok || epResult?.error) {
            console.error("EasyParcel making-order failed:", epResult);
          } else {
            console.log(
              "EasyParcel making-order triggered successfully:",
              reference
            );
          }
        } catch (epError) {
          console.error(
            "Failed to trigger EasyParcel making-order:",
            reference,
            epError
          );
        }

        break;
      }

      case "error":
      case "cancelled":
      case "blocked": {
        if (order.paymentStatus !== "paid") {
          const { error } = await supabase
            .from("orders")
            .update({
              paymentStatus: "failed",
              orderStatus: "cancelled_due_to_payment",
            })
            .eq("id", order.id);

          if (error) {
            console.error("Failed to update FAILED order:", error);
          } else {
            console.log("Order marked as FAILED:", reference);
          }
        }
        break;
      }

      case "created":
      case "viewed":
        console.log("CHIP status ignored:", status, reference);
        break;

      default:
        console.warn(`Unknown CHIP status '${status}' for order ${reference}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("🔥 CHIP webhook error:", err);
    return NextResponse.json({ received: true });
  }
}
