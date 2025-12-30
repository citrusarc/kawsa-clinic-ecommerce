import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_GET_ORDER_URL = process.env.EASYPARCEL_DEMO_GET_ORDER_URL!;

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("orderWorkflowStatus", "payment_done_awb_pending");

    if (error) throw error;

    let updated = 0;

    for (const order of orders) {
      const payload = {
        api: EASYPARCEL_API_KEY,
        order_no: order.easyparcelOrderNumber,
      };

      const res = await fetch(EASYPARCEL_GET_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      const parcel = result?.result?.[0]?.parcel?.[0];

      if (!parcel?.awb) continue;

      await supabase
        .from("orders")
        .update({
          trackingNumber: parcel.parcelno,
          trackingUrl: parcel.tracking_url,
          awbNumber: parcel.awb,
          awbPdfUrl: parcel.awb_id_link,
          orderWorkflowStatus: "awb_generated",
          deliveryStatus: "ready_for_pickup",
        })
        .eq("id", order.id);

      updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Sync failed", details: String(err) },
      { status: 500 }
    );
  }
}
