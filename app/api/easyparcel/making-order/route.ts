import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_MAKING_ORDER_URL =
  process.env.EASYPARCEL_DEMO_MAKING_ORDER_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, mode } = body;

    if (mode === "cron") {
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let ordersToProcess = [];

    if (mode === "cron") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("paymentStatus", "paid")
        .in("orderWorkflowStatus", [
          "pending_easyparcel_order",
          "payment_confirmed",
        ])
        .is("easyparcelOrderNumber", null);

      if (error) throw error;
      ordersToProcess = orders;
    } else {
      if (!orderId) {
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }

      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      ordersToProcess = [order];
    }

    let processedCount = 0;
    const failedOrders = [];

    for (const order of ordersToProcess) {
      console.log(`Processing order ${order.orderNumber} (ID: ${order.id})`);

      if (!order.serviceId) {
        console.log(`Skipping order ${order.orderNumber} - no serviceId`);
        continue;
      }

      if (
        !["pending_easyparcel_order", "payment_confirmed"].includes(
          order.orderWorkflowStatus
        )
      ) {
        console.log(
          `Skipping order ${order.orderNumber} - wrong status: ${order.orderWorkflowStatus}`
        );
        continue;
      }

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("orderId", order.id);

      if (!items || items.length === 0) {
        console.log(`Skipping order ${order.orderNumber} - no items`);
        continue;
      }

      // ============ DEBUG: ORDER ITEMS ============
      console.log(`\n📦 ORDER ITEMS DEBUG for ${order.orderNumber}:`);
      console.log(`   Total items in order: ${items.length}`);

      items.forEach((item, index) => {
        console.log(`\n   Item ${index + 1}:`);
        console.log(`     - Name: ${item.itemName}`);
        console.log(`     - Quantity: ${item.itemQuantity}`);
        console.log(
          `     - Weight: ${item.itemWeight} kg × ${item.itemQuantity} = ${
            Number(item.itemWeight) * Number(item.itemQuantity)
          } kg`
        );
        console.log(
          `     - Dimensions: ${item.itemWidth}cm × ${item.itemLength}cm × ${item.itemHeight}cm`
        );
        console.log(`     - Price: RM ${item.itemTotalPrice}`);
      });

      const totalWeight = items.reduce(
        (sum, item) =>
          sum + Number(item.itemWeight || 0) * Number(item.itemQuantity || 1),
        0
      );

      if (totalWeight <= 0) {
        console.log(`Skipping order ${order.orderNumber} - invalid weight`);
        continue;
      }

      const maxWidth = Math.max(
        ...items.map((i) => Math.ceil(Number(i.itemWidth) || 1))
      );
      const maxLength = Math.max(
        ...items.map((i) => Math.ceil(Number(i.itemLength) || 1))
      );
      const maxHeight = Math.max(
        ...items.map((i) => Math.ceil(Number(i.itemHeight) || 1))
      );
      const totalValue = items.reduce(
        (sum, item) => sum + Number(item.itemTotalPrice || 0),
        0
      );

      console.log(`\n   📊 CALCULATED PARCEL DIMENSIONS:`);
      console.log(`     - Total Weight: ${totalWeight} kg`);
      console.log(`     - Width (max): ${maxWidth} cm`);
      console.log(`     - Length (max): ${maxLength} cm`);
      console.log(`     - Height (max): ${maxHeight} cm`);
      console.log(`     - Total Value: RM ${totalValue}`);

      // Check for potential issues
      if (maxWidth <= 1 || maxLength <= 1 || maxHeight <= 1) {
        console.log(
          `\n   ⚠️  WARNING: One or more dimensions = 1cm (default fallback)`
        );
        console.log(`      This might indicate missing dimension data!`);
      }

      if (totalWeight < 0.1 && items.length > 1) {
        console.log(
          `\n   ⚠️  WARNING: Total weight < 0.1kg for ${items.length} items`
        );
        console.log(`      This seems unusually light!`);
      }

      if (items.length > 1) {
        const allSameQty = items.every(
          (item) => item.itemQuantity === items[0].itemQuantity
        );
        console.log(`\n   📋 MULTI-ITEM ORDER ANALYSIS:`);
        console.log(
          `     - All items have same quantity: ${allSameQty ? "YES" : "NO"}`
        );
        console.log(
          `     - Quantities: ${items.map((i) => i.itemQuantity).join(", ")}`
        );
      }
      // ============ END DEBUG ============

      const payload = {
        api: EASYPARCEL_API_KEY,
        bulk: [
          {
            weight: totalWeight,
            width: maxWidth,
            length: maxLength,
            height: maxHeight,
            content: "skincare",
            value: totalValue,
            service_id: order.serviceId,
            pick_name: "DRKAY MEDIBEAUTY SDN BHD",
            pick_contact: "+60123456789",
            pick_addr1: "39-02, Jalan Padi Emas 1/8",
            pick_city: "Johor Bahru",
            pick_state: "Johor",
            pick_code: "81200",
            pick_country: "MY",
            send_name: order.fullName,
            send_contact: order.phoneNumber,
            send_email: order.email,
            send_addr1: order.addressLine1,
            send_addr2: order.addressLine2 || "",
            send_city: order.city,
            send_state: order.state,
            send_code: String(order.postcode),
            send_country: "MY",
            collect_date: new Date().toISOString().split("T")[0],
            sms: true,
            reference: String(order.orderNumber),
          },
        ],
      };

      console.log(
        `\n📤 SENDING TO EASYPARCEL:`,
        JSON.stringify(payload.bulk[0], null, 2)
      );

      let response;
      let result;
      try {
        response = await fetch(EASYPARCEL_MAKING_ORDER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        result = await response.json();
        console.log(
          `\n📥 EasyParcel API response for order ${order.orderNumber}:`,
          JSON.stringify(result, null, 2)
        );
      } catch (fetchError) {
        console.error(
          `Fetch error for order ${order.orderNumber}:`,
          fetchError
        );
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "Fetch failed",
        });
        continue;
      }

      if (!response.ok) {
        console.error(
          `EasyParcel API error for order ${order.orderNumber}:`,
          result
        );
        failedOrders.push({ orderNumber: order.orderNumber, error: result });
        continue;
      }

      if (result?.api_status !== "Success") {
        console.error(
          `EasyParcel API returned non-success for order ${order.orderNumber}:`,
          result
        );
        failedOrders.push({ orderNumber: order.orderNumber, error: result });
        continue;
      }

      const epOrder = result?.result?.[0];
      if (!epOrder?.order_number) {
        console.error(
          `No order_number in result for order ${order.orderNumber}:`,
          result
        );
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "No order_number",
        });
        continue;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          easyparcelOrderNumber: epOrder.order_number,
          courierName: epOrder.courier_name || order.courierName,
          orderWorkflowStatus: "easyparcel_order_created",
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
          error: updateError,
        });
      } else {
        console.log(`✅ Successfully processed order ${order.orderNumber}`);
        processedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      totalOrders: ordersToProcess.length,
      failedOrders: failedOrders.length > 0 ? failedOrders : undefined,
    });
  } catch (err) {
    console.error("EasyParcel making-order error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
