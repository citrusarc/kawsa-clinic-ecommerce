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

      // ============ FIXED: Better dimension handling ============
      const totalWeight = items.reduce(
        (sum, item) =>
          sum + Number(item.itemWeight || 0) * Number(item.itemQuantity || 1),
        0
      );

      if (totalWeight <= 0) {
        console.log(`Skipping order ${order.orderNumber} - invalid weight`);
        continue;
      }

      // Use realistic defaults for missing dimensions
      const DEFAULT_SERUM_BOTTLE = { width: 5, length: 5, height: 12 }; // 5x5x12cm serum bottle
      const DEFAULT_MASK_PACK = { width: 15, length: 20, height: 1 }; // 15x20x1cm flat mask
      const DEFAULT_CREAM_JAR = { width: 8, length: 8, height: 6 }; // 8x8x6cm cream jar

      // Get dimensions for each item with smart defaults
      const itemDimensions = items.map((item) => {
        let width = Number(item.itemWidth) || 0;
        let length = Number(item.itemLength) || 0;
        let height = Number(item.itemHeight) || 0;

        // If any dimension is missing or = 1 (fallback), use smart defaults based on item name
        if (width <= 1 || length <= 1 || height <= 1) {
          const itemName = (item.itemName || "").toLowerCase();

          if (
            itemName.includes("serum") ||
            itemName.includes("toner") ||
            itemName.includes("essence")
          ) {
            // Bottle-shaped products
            width = DEFAULT_SERUM_BOTTLE.width;
            length = DEFAULT_SERUM_BOTTLE.length;
            height = DEFAULT_SERUM_BOTTLE.height;
          } else if (itemName.includes("mask") || itemName.includes("sheet")) {
            // Flat products
            width = DEFAULT_MASK_PACK.width;
            length = DEFAULT_MASK_PACK.length;
            height = DEFAULT_MASK_PACK.height;
          } else {
            // Default for creams, gels, etc.
            width = DEFAULT_CREAM_JAR.width;
            length = DEFAULT_CREAM_JAR.length;
            height = DEFAULT_CREAM_JAR.height;
          }

          console.log(
            `   ℹ️  Using default dimensions for "${item.itemName}": ${width}×${length}×${height}cm`
          );
        }

        return { width, length, height };
      });

      // Calculate parcel dimensions (max of all items)
      const maxWidth = Math.max(
        ...itemDimensions.map((d) => Math.ceil(d.width))
      );
      const maxLength = Math.max(
        ...itemDimensions.map((d) => Math.ceil(d.length))
      );
      const maxHeight = Math.max(
        ...itemDimensions.map((d) => Math.ceil(d.height))
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

      // Validation: Ensure dimensions are reasonable
      if (maxWidth < 1 || maxLength < 1 || maxHeight < 1) {
        console.log(`\n   ❌ ERROR: Invalid dimensions after calculation`);
        failedOrders.push({
          orderNumber: order.orderNumber,
          error: "Invalid parcel dimensions",
        });
        continue;
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
      // ============ END FIXED ============

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
