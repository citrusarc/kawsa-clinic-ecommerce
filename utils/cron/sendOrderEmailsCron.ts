import cron from "node-cron";
import { sendPendingOrderEmails } from "../sendPendingOrderEmails";

// // Schedule cron every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("Cron job started: Sending pending order emails...");
  try {
    await sendPendingOrderEmails();
  } catch (err) {
    console.error("Cron job failed:", err);
  }
});
