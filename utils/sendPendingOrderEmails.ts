import fetch from "node-fetch"; // // Node.js fetch
import { createClient } from "@supabase/supabase-js"; // // Node.js Supabase client
import dotenv from "dotenv"; // // environment variables

dotenv.config(); // //

export async function sendPendingOrderEmails() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id")
    .eq("payment_status", "paid")
    .not("awb_number", "is", null)
    .eq("emailSent", false);

  if (error) {
    console.error("Fetch orders error:", error);
    return;
  }

  for (const order of orders ?? []) {
    try {
      await fetch(`${process.env.SITE_URL}/api/email-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
    } catch (err) {
      console.error("Email trigger failed for order:", order.id, err);
    }
  }

  console.log("Done sending pending emails");
}

// // Optional: run manually
if (require.main === module) {
  sendPendingOrderEmails();
}
