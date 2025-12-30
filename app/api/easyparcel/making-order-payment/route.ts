import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { EasyParcelResponse } from "@/types";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, mode } = body;

    if (mode === "cron") {
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let ordersToProcess = [];

    if (mode === "cron") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("orderWorkflowStatus", "easyparcel_order_created")
        .not("easyparcelOrderNumber", "is", null)
        .is("trackingNumber", null)
        .eq("paymentStatus", "paid");

      if (error) throw error;
      ordersToProcess = orders || [];
    } else {
      if (!orderId)
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order)
        return NextResponse.json({ error: "Order not found" }, { status: 404 });

      ordersToProcess = [order];
    }

    // // Added tracking for processed orders
    let processedCount = 0;
    const failedOrders = [];

    for (const order of ordersToProcess) {
      // // Added detailed logging
      console.log(
        `Processing payment for order ${order.orderNumber} (ID: ${order.id})`
      );
      console.log(
        `Order status: ${order.orderWorkflowStatus}, EasyParcel Order: ${order.easyparcelOrderNumber}`
      );

      if (order.orderWorkflowStatus !== "easyparcel_order_created") {
        console.log(
          `Skipping order ${order.orderNumber} - wrong status: ${order.orderWorkflowStatus}`
        );
        continue;
      }

      if (!order.easyparcelOrderNumber || order.trackingNumber) {
        console.log(
          `Skipping order ${order.orderNumber} - no EP order or already has tracking`
        );
        continue;
      }

      const payload = {
        api: EASYPARCEL_API_KEY,
        bulk: [{ order_no: order.easyparcelOrderNumber }],
      };

      // // Added better error handling
      let response;
      let result: EasyParcelResponse;

      try {
        console.log(
          `Calling EasyParcel payment API for order ${order.orderNumber}`
        );
        response = await fetch(EASYPARCEL_DEMO_MAKING_ORDER_PAYMENT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        result = await response.json();
        console.log(
          `EasyParcel payment API response for order ${order.orderNumber}:`,
          JSON.stringify(result)
        );
      } catch (fetchError) {
        console.error(
          `Fetch error for order ${order.orderNumber}:`,
          fetchError
        );
        failedOrders.push({
          orderNumber: order.orderNumber,
          easyparcelOrderNumber: order.easyparcelOrderNumber,
          error: "Fetch failed",
          details:
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError),
        });
        continue;
      }

      // // Improved response validation
      if (!response.ok) {
        console.error(
          `EasyParcel payment API HTTP error for order ${order.orderNumber}:`,
          response.status,
          result
        );
        failedOrders.push({
          orderNumber: order.orderNumber,
          easyparcelOrderNumber: order.easyparcelOrderNumber,
          error: `HTTP ${response.status}`,
          details: result,
        });
        continue;
      }

      if (result?.api_status !== "Success") {
        console.error(
          `EasyParcel payment API returned non-success for order ${order.orderNumber}:`,
          result
        );
        failedOrders.push({
          orderNumber: order.orderNumber,
          easyparcelOrderNumber: order.easyparcelOrderNumber,
          error: "API Status not Success",
          details: result,
        });
        continue;
      }

      const paymentResult = result.result?.[0];

      // // Added better validation for payment result
      if (!paymentResult) {
        console.error(`No payment result for order ${order.orderNumber}`);
        failedOrders.push({
          orderNumber: order.orderNumber,
          easyparcelOrderNumber: order.easyparcelOrderNumber,
          error: "No payment result",
        });
        continue;
      }

      const parcelInfo = paymentResult?.parcel?.[0];

      if (!parcelInfo?.awb) {
        console.error(
          `No AWB in parcel info for order ${order.orderNumber}:`,
          paymentResult
        );
        failedOrders.push({
          orderNumber: order.orderNumber,
          easyparcelOrderNumber: order.easyparcelOrderNumber,
          error: "No AWB in response",
          details: paymentResult,
        });
        continue;
      }

      // // Update database with better error handling
      console.log(
        `Updating order ${order.orderNumber} with AWB: ${parcelInfo.awb}`
      );

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          trackingNumber: parcelInfo.parcelno,
          trackingUrl: parcelInfo.tracking_url,
          awbNumber: parcelInfo.awb,
          awbPdfUrl: parcelInfo.awb_id_link,
          orderWorkflowStatus: "awb_generated",
          deliveryStatus: "ready_for_pickup",
          orderStatus: "processing",
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(
          `Failed to update order ${order.orderNumber}:`,
          updateError
        );
        failedOrders.push({
          orderNumber: order.orderNumber,
          easyparcelOrderNumber: order.easyparcelOrderNumber,
          error: "Database update failed",
          details: updateError,
        });
      } else {
        console.log(
          `Successfully processed payment for order ${order.orderNumber}`
        );
        processedCount++;
      }
    }

    // // Return detailed response
    return NextResponse.json({
      success: true,
      processedCount,
      totalOrders: ordersToProcess.length,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    console.error("EasyParcel making-order-payment error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
