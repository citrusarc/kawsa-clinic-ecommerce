import cron from "node-cron";

cron.schedule("*/5 * * * *", async () => {
  console.log("Checking for pending emails...");

  try {
    await fetch(`${process.env.SITE_URL}/api/email-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "all" }),
    });
  } catch (err) {
    console.error("Cron email trigger failed:", err);
  }
});
