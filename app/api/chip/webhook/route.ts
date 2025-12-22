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

    if (order.paymentStatus === "paid") {
      console.log("Order already paid, skipping:", reference);
      return NextResponse.json({ received: true });
    }

    switch (status) {
      case "paid": {
        const { error } = await supabase
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
          })
          .eq("id", order.id);

        if (error) {
          console.error("Failed to update PAID order:", error);
        } else {
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

            if (!epResponse.ok || epResult.error) {
              console.error("EasyParcel API failed:", epResult);
            } else {
              console.log(
                "EasyParcel making-order successfully triggered:",
                epResult
              );
            }
          } catch (epError) {
            console.error(
              "Failed to trigger EasyParcel for order:",
              reference,
              epError
            );
          }
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
    console.error("🔥 Webhook error:", err);
    return NextResponse.json({ received: true });
  }
}
