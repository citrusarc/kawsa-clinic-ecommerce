import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendPendingOrderEmails() {
  // 1️⃣ Get all orders that need email
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

  // 2️⃣ Trigger email-confirmation API for each order
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

// Optional: allow running standalone via `node utils/sendPendingOrderEmails.ts`
if (require.main === module) {
  sendPendingOrderEmails();
}
