import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { CheckoutItem, CheckoutBody } from "@/types";

const CHIP_API_URL = "https://gate.chip-in.asia/api/v1/purchases/";
const CHIP_BRAND_ID = process.env.CHIP_BRAND_ID!;
const CHIP_TOKEN = process.env.CHIP_TEST_API_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    // 1. Create order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        orderNumber: "ORD-" + Date.now(),
        fullName: body.fullName,
        email: body.email,
        phoneNumber: body.phoneNumber,
        address: body.address,
        totalPrice: body.totalPrice,
        shippingFee: body.shippingFee ?? 10,
        courierName: body.courierName ?? "J&T",
        paymentMethod: body.paymentMethod ?? "COD",
        paymentStatus: "pending",
        orderStatus: "pending",
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: orderError?.message || "Failed to create order" },
        { status: 500 }
      );
    }

    const orderId = orderData.id;

    // 2. Insert order items
    const orderItems = body.items.map((item: CheckoutItem) => {
      const safeUnitPrice = Number(item.itemUnitPrice) || 0; // FIXED
      const safeQuantity = Number(item.itemQuantity) || 1;

      return {
        orderId,
        productId: item.productId || null,
        variantId: item.variantId || null,
        variantOptionId: item.variantOptionId || null,
        itemName: item.itemName || item.name || "Unknown Product",
        itemCurrency: "RM",
        itemUnitPrice: safeUnitPrice,
        itemQuantity: safeQuantity,
        itemTotalPrice: safeUnitPrice * safeQuantity,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items insert failed:", itemsError);
      return NextResponse.json(
        { error: "Failed to save order items: " + itemsError.message },
        { status: 500 }
      );
    }

    const SUCCESS_REDIRECT = `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?status=success`;
    const FAILURE_REDIRECT = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?status=failed`;

    // ------------------------------------
    // 3. FIX: CLEAN AND SAFE CHIP PAYLOAD
    // ------------------------------------

    const chipPayload = {
      client: {
        email: body.email,
        full_name: body.fullName,
        phone: body.phoneNumber,
      },
      purchase: {
        products: body.items.map((item: CheckoutItem) => ({
          name: item.itemName || item.name || "Product",
          price: Math.round(Number(item.itemUnitPrice || 0) * 100),
        })),
        currency: "MYR",
      },
      brand_id: CHIP_BRAND_ID,
      reference: orderData.orderNumber,
      send_receipt: true,
      platform: "web",
      success_redirect: SUCCESS_REDIRECT,
      failure_redirect: FAILURE_REDIRECT,

      // ✅ FPX only
      payment_method_whitelist: ["fpx"],
    };

    // For debugging:
    console.log("CHIP Payload Sent:", chipPayload); // FIXED

    // 4. Call CHIP
    const chipResponse = await fetch(CHIP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHIP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chipPayload),
    });

    const chipData = await chipResponse.json();

    if (!chipResponse.ok) {
      console.error("Chip API error:", chipData);

      // Mark order as failed
      await supabase
        .from("orders")
        .update({
          paymentStatus: "error",
          orderStatus: "failed",
        })
        .eq("id", orderId);

      return NextResponse.json(
        { error: chipData.message || "Failed to create Chip purchase." },
        { status: chipResponse.status }
      );
    }

    // 5. Save CHIP purchase_id
    await supabase
      .from("orders")
      .update({
        chipPurchaseId: chipData.id,
        paymentStatus: "created",
        orderStatus: "pending",
      })
      .eq("id", orderId);

    return NextResponse.json({
      message: "Order created successfully!",
      orderId,
      orderNumber: orderData.orderNumber,
      success: true,
      checkout_url: chipData.checkout_url,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";

    console.error("API Error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
