import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Get orders that need email
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id")
    .eq("payment_status", "paid")
    .is("awb_number", null, false)
    .eq("emailSent", false);

  if (error) {
    console.error("Fetch orders error:", error);
    return new Response("Error", { status: 500 });
  }

  // 2. Trigger email API for each order
  for (const order of orders) {
    try {
      await fetch(`${Deno.env.get("SITE_URL")}/api/email-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
    } catch (err) {
      console.error("Email trigger failed for order:", order.id);
    }
  }

  return new Response("Done", { status: 200 });
});
