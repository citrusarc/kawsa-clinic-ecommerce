import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_MAKING_ORDER_PAYMENT_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL!;

export async function POST(req: NextRequest) {
  const executionId = `PAYMENT-${Date.now()}`;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🟦 [${executionId}] making-order-payment started`);

  try {
    const body = await req.json();
    const { orderId, mode } = body;
    console.log(
      `📝 [${executionId}] Mode: ${mode}, OrderId: ${orderId || "N/A"}`
    );

    if (mode === "cron") {
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET) {
        console.log(`❌ [${executionId}] Unauthorized - invalid cron secret`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let ordersToProcess = [];

    if (mode === "cron") {
      console.log(`🔍 [${executionId}] Querying database for orders...`);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("orderWorkflowStatus", "easyparcel_order_created")
        .eq("paymentStatus", "paid")
        .is("trackingNumber", null);

      if (error) {
        console.error(`❌ [${executionId}] Database error:`, error);
        throw error;
      }

      ordersToProcess = orders || [];
      console.log(
        `📊 [${executionId}] Found ${ordersToProcess.length} orders to process`
      );

      if (ordersToProcess.length > 0) {
        ordersToProcess.forEach((o) => {
          console.log(
            `  - Order: ${o.orderNumber}, EP Order: ${o.easyparcelOrderNumber}`
          );
        });
      }
    } else {
      if (!orderId) {
        console.log(`❌ [${executionId}] Missing orderId for manual mode`);
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }

      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        console.log(`❌ [${executionId}] Order not found: ${orderId}`);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      ordersToProcess = [order];
      console.log(
        `📝 [${executionId}] Manual mode - processing order: ${order.orderNumber}`
      );
    }

    if (ordersToProcess.length === 0) {
      console.log(`✅ [${executionId}] No orders to process - exiting cleanly`);
      console.log(`${"=".repeat(60)}\n`);
      return NextResponse.json({
        success: true,
        processedCount: 0,
        totalOrders: 0,
        message: "No orders found matching criteria",
      });
    }

    let processedCount = 0;
    const failedOrders = [];

    for (const order of ordersToProcess) {
      console.log(
        `\n🔄 [${executionId}] Processing order ${order.orderNumber}`
      );
      console.log(`   EP Order Number: ${order.easyparcelOrderNumber}`);
      console.log(`   Current Status: ${order.orderWorkflowStatus}`);

      const paymentPayload = {
        api: EASYPARCEL_API_KEY,
        bulk: [{ order_no: order.easyparcelOrderNumber }],
      };

      let result;
      try {
        console.log(`📤 [${executionId}] Calling EasyParcel payment API...`);

        const response = await fetch(EASYPARCEL_MAKING_ORDER_PAYMENT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentPayload),
        });

        result = await response.json();
        console.log(
          `📥 [${executionId}] EasyParcel API Response Status:`,
          result.api_status
        );
        console.log(
          `📥 [${executionId}] Full Response:`,
          JSON.stringify(result, null, 2)
        );

        if (!response.ok || result.api_status !== "Success") {
          throw new Error("Payment API failed");
        }
      } catch (err) {
        console.error(
          `❌ [${executionId}] Payment API error for ${order.orderNumber}:`,
          err
        );
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "Payment API error",
        });
        continue;
      }

      const paymentResult = result?.result?.[0];
      if (!paymentResult) {
        console.error(`❌ [${executionId}] No payment result in API response`);
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "No payment result",
        });
        continue;
      }

      let parcelList = [];
      if (Array.isArray(paymentResult.parcel)) {
        parcelList = paymentResult.parcel;
      } else if (Array.isArray(paymentResult.result)) {
        parcelList = paymentResult.result;
      }

      console.log(
        `📦 [${executionId}] Found ${parcelList.length} parcels in response`
      );

      if (parcelList.length === 0) {
        console.log(
          `⚠️  [${executionId}] No parcels found - updating to payment_done_awb_pending`
        );

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            orderWorkflowStatus: "payment_done_awb_pending",
            orderStatus: "processing",
          })
          .eq("id", order.id);

        if (updateError) {
          console.error(`❌ [${executionId}] DB update failed:`, updateError);
        } else {
          console.log(
            `✅ [${executionId}] Updated to payment_done_awb_pending`
          );
        }

        processedCount++;
        continue;
      }

      const parcel = parcelList[0];
      const parcelNumber = parcel.parcel_number || parcel.parcelno;
      const awbNumber = parcel.awb;

      console.log(`📋 [${executionId}] Parcel Details:`);
      console.log(`   Parcel Number: ${parcelNumber}`);
      console.log(`   AWB Number: ${awbNumber}`);
      console.log(`   Tracking URL: ${parcel.tracking_url || "N/A"}`);

      if (!awbNumber || awbNumber.trim() === "" || !parcelNumber) {
        console.log(
          `⚠️  [${executionId}] Empty AWB/parcel number - updating to payment_done_awb_pending`
        );

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            orderWorkflowStatus: "payment_done_awb_pending",
            orderStatus: "processing",
          })
          .eq("id", order.id);

        if (updateError) {
          console.error(`❌ [${executionId}] DB update failed:`, updateError);
        } else {
          console.log(
            `✅ [${executionId}] Updated to payment_done_awb_pending`
          );
        }

        processedCount++;
        continue;
      }

      console.log(
        `💾 [${executionId}] Updating database with AWB ${awbNumber}...`
      );

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          trackingNumber: parcelNumber,
          trackingUrl: parcel.tracking_url || null,
          awbNumber: awbNumber,
          awbPdfUrl: parcel.awb_id_link || null,
          orderWorkflowStatus: "awb_generated",
          deliveryStatus: parcel.ship_status || "ready_for_pickup",
          orderStatus: "processing",
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(
          `❌ [${executionId}] Database update failed:`,
          updateError
        );
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "Database update failed: " + updateError.message,
        });
        continue;
      }

      console.log(
        `✅ [${executionId}] Successfully processed order ${order.orderNumber} with AWB ${awbNumber}`
      );
      processedCount++;
    }

    console.log(`\n📊 [${executionId}] Final Summary:`);
    console.log(`   Total Orders Found: ${ordersToProcess.length}`);
    console.log(`   Successfully Processed: ${processedCount}`);
    console.log(`   Failed: ${failedOrders.length}`);
    if (failedOrders.length > 0) {
      console.log(`   Failed Orders:`, failedOrders);
    }
    console.log(`${"=".repeat(60)}\n`);

    return NextResponse.json({
      success: true,
      processedCount,
      totalOrders: ordersToProcess.length,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    console.error(`❌ [${executionId}] CRITICAL ERROR:`, err);
    console.log(`${"=".repeat(60)}\n`);
    return NextResponse.json(
      { error: "Internal error", details: String(err) },
      { status: 500 }
    );
  }
}
