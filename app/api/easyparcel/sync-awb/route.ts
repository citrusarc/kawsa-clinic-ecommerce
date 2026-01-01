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
        updated: 0,
        message: "No pending AWB orders",
      });
    }

    console.log(
      `\n🔄 Found ${orders.length} orders in payment_done_awb_pending status`
    );

    let updatedCount = 0;
    const failedOrders: { orderNumber: string; error: string }[] = [];

    for (const order of orders) {
      const orderNumber = String(order.orderNumber ?? "UNKNOWN");
      const easyparcelOrderNo = String(order.easyparcelOrderNumber ?? "");

      console.log(`\n--- Processing order ${orderNumber} ---`);

      try {
        if (!easyparcelOrderNo.trim()) {
          console.log(`❌ Missing EasyParcel order number`);
          failedOrders.push({
            orderNumber,
            error: "Missing EasyParcel order number",
          });
          continue;
        }

        console.log(`📞 Calling parcel status API for: ${easyparcelOrderNo}`);

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
            `❌ EasyParcel API failed (HTTP ${response.status}):`,
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
        console.log(`📋 Order result:`, JSON.stringify(orderResult, null, 2));

        if (!orderResult || orderResult.status !== "Success") {
          console.log(`❌ Order result status not Success`);
          failedOrders.push({
            orderNumber,
            error:
              orderResult?.remarks || "Invalid EasyParcel response structure",
          });
          continue;
        }

        // Get parcel data - EasyParcel returns it in "result", not "parcel"
        const parcelList = Array.isArray(orderResult.result)
          ? orderResult.result
          : [];

        console.log(`📦 Parcel list length: ${parcelList.length}`);
        console.log(`📦 Parcel data:`, JSON.stringify(parcelList, null, 2));

        if (parcelList.length === 0) {
          console.log(`⏳ AWB not ready yet (empty parcel array)`);
          continue;
        }

        // Check for parcels with AWB
        const parcelsWithAwb = parcelList.filter(
          (p: EasyParcelItem) => p?.awb && p?.parcel_number
        );

        console.log(
          `✅ Parcels with AWB: ${parcelsWithAwb.length}/${parcelList.length}`
        );

        if (parcelsWithAwb.length === 0) {
          console.log(`⏳ Parcels exist but AWB still missing`);
          continue;
        }

        // Update order with AWB info
        const primaryParcel = parcelsWithAwb[0];

        const updateData = {
          trackingNumber: primaryParcel.parcel_number,
          trackingUrl: primaryParcel.tracking_url || null,
          awbNumber: primaryParcel.awb,
          awbPdfUrl: primaryParcel.awb_id_link || null,
          orderWorkflowStatus: "awb_generated",
          deliveryStatus: primaryParcel.ship_status || "ready_for_pickup",
          orderStatus: "processing",
        };

        console.log(`💾 Updating order with:`, updateData);

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

        console.log(
          `✅ Successfully updated order ${orderNumber} to awb_generated`
        );
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

    console.log(
      `\n🎉 Sync complete: ${updatedCount}/${orders.length} orders updated`
    );

    return NextResponse.json({
      success: true,
      updatedCount,
      totalOrders: orders.length,
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
