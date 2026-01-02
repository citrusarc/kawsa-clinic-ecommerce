import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { EasyParcelItem } from "@/types";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_PARCEL_STATUS_URL =
  process.env.EASYPARCEL_DEMO_PARCEL_STATUS_URL!;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("orderWorkflowStatus", "payment_done_awb_pending");

    if (fetchError) {
      console.error("Failed to fetch pending AWB orders:", fetchError);
      throw fetchError;
    }

    if (!orders?.length) {
      console.log("✓ No pending AWB orders found");
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "No pending AWB orders",
      });
    }

    console.log(`\n${"=".repeat(70)}`);
    console.log(`🔄 AWB SYNC CRON JOB - ${new Date().toISOString()}`);
    console.log(`   Found ${orders.length} order(s) waiting for AWB`);
    console.log(`${"=".repeat(70)}\n`);

    let updatedCount = 0;
    const failedOrders: { orderNumber: string; error: string }[] = [];

    for (const order of orders) {
      const orderNumber = String(order.orderNumber ?? "UNKNOWN");
      const easyparcelOrderNo = String(order.easyparcelOrderNumber ?? "");

      console.log(`\n━━━ Checking order ${orderNumber} ━━━`);
      console.log(`   EasyParcel Order: ${easyparcelOrderNo}`);

      try {
        if (!easyparcelOrderNo.trim()) {
          console.log(`❌ Missing EasyParcel order number`);
          failedOrders.push({
            orderNumber,
            error: "Missing EasyParcel order number",
          });
          continue;
        }

        console.log(`📞 Calling parcel status API...`);

        const response = await fetch(EASYPARCEL_PARCEL_STATUS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api: EASYPARCEL_API_KEY,
            bulk: [{ order_no: easyparcelOrderNo }],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          console.error(
            `❌ API call failed (HTTP ${response.status}):`,
            errorText
          );
          failedOrders.push({
            orderNumber,
            error: `EasyParcel API error - HTTP ${response.status}`,
          });
          continue;
        }

        const result = await response.json();
        console.log(`📦 API Response:`, JSON.stringify(result, null, 2));

        if (result?.api_status !== "Success") {
          console.log(`❌ API status not Success:`, result?.error_remark);
          failedOrders.push({
            orderNumber,
            error: result?.error_remark || "API returned non-success status",
          });
          continue;
        }

        const orderResult = result?.result?.[0];

        if (!orderResult || orderResult.status !== "Success") {
          console.log(`❌ Order result status not Success`);
          failedOrders.push({
            orderNumber,
            error: orderResult?.remarks || "Invalid response structure",
          });
          continue;
        }

        // Try both possible field names
        let parcelList = [];
        if (Array.isArray(orderResult.parcel)) {
          parcelList = orderResult.parcel;
          console.log(
            `📦 Found ${parcelList.length} parcel(s) in "parcel" field`
          );
        } else if (Array.isArray(orderResult.result)) {
          parcelList = orderResult.result;
          console.log(
            `📦 Found ${parcelList.length} parcel(s) in "result" field`
          );
        }

        console.log(
          `📦 Full parcel data:`,
          JSON.stringify(parcelList, null, 2)
        );

        if (parcelList.length === 0) {
          console.log(`⏳ Still waiting - empty parcel array`);
          console.log(`   → Will check again on next cron run`);
          continue;
        }

        // Filter parcels that have AWB ready (awb can be empty string)
        const parcelsWithAwb = parcelList.filter(
          (p: EasyParcelItem) =>
            p?.awb && p.awb.trim() !== "" && p?.parcel_number
        );

        console.log(`📊 Parcel status:`);
        console.log(`   - Total parcels: ${parcelList.length}`);
        console.log(`   - Parcels with AWB: ${parcelsWithAwb.length}`);

        if (parcelsWithAwb.length === 0) {
          console.log(`⏳ Still waiting - AWB not generated yet`);
          console.log(`   → Will check again on next cron run`);
          continue;
        }

        // AWB is ready! Update order
        const parcel = parcelsWithAwb[0];

        const updateData = {
          trackingNumber: parcel.parcel_number,
          trackingUrl: parcel.tracking_url || null,
          awbNumber: parcel.awb,
          awbPdfUrl: parcel.awb_id_link || null,
          orderWorkflowStatus: "awb_generated",
          deliveryStatus: parcel.ship_status || "ready_for_pickup",
          orderStatus: "processing",
        };

        console.log(`✅ AWB is ready! Updating order...`);
        console.log(`💾 Update data:`, JSON.stringify(updateData, null, 2));

        const { error: updateError } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", order.id);

        if (updateError) {
          console.error(`❌ Database update failed:`, updateError);
          failedOrders.push({
            orderNumber,
            error: "Database update failed",
          });
          continue;
        }

        console.log(`🎉 Successfully updated order ${orderNumber}`);
        console.log(`   - AWB: ${parcel.awb}`);
        console.log(`   - Tracking: ${parcel.parcel_number}`);
        console.log(`   - Status: ${parcel.ship_status || "ready_for_pickup"}`);

        updatedCount++;
      } catch (orderErr) {
        const errorMessage = getErrorMessage(orderErr);
        console.error(`❌ Error processing order:`, errorMessage);
        failedOrders.push({
          orderNumber,
          error: errorMessage,
        });
      }
    }

    console.log(`\n${"=".repeat(70)}`);
    console.log(`🎉 SYNC COMPLETE`);
    console.log(`   - Updated: ${updatedCount}/${orders.length} orders`);
    console.log(
      `   - Still waiting: ${
        orders.length - updatedCount - failedOrders.length
      }`
    );
    console.log(`   - Failed: ${failedOrders.length}`);
    console.log(`${"=".repeat(70)}\n`);

    return NextResponse.json({
      success: true,
      updatedCount,
      totalOrders: orders.length,
      stillWaiting: orders.length - updatedCount - failedOrders.length,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    console.error("❌ Critical sync AWB error:", errorMessage, err);
    return NextResponse.json(
      {
        success: false,
        error: "Sync failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
