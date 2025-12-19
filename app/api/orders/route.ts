import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { OrderItem, OrderBody } from "@/types";

const CHIP_API_URL = process.env.CHIP_API_URL!;
const CHIP_BRAND_ID = process.env.CHIP_BRAND_ID!;
const CHIP_TOKEN = process.env.CHIP_TEST_API_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const body: OrderBody = await req.json();

    const {
      fullName,
      email,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      postcode,
      country,
      subTotalPrice,
      shippingFee,
      paymentMethod,
      easyparcel,
      items,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const totalPrice = Number(subTotalPrice || 0) + Number(shippingFee || 0);

    // 1. Create order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        orderNumber: "ORD-" + Date.now(),
        fullName,
        email,
        phoneNumber,

        addressLine1,
        addressLine2,
        city,
        state,
        postcode,
        country,

        subTotalPrice,
        shippingFee,
        totalPrice: totalPrice,
        paymentMethod,
        paymentStatus: "pending",

        rateId: easyparcel?.rateId,
        serviceId: easyparcel?.serviceId,
        serviceName: easyparcel?.serviceName,
        courierId: easyparcel?.courierId,
        courierName: easyparcel?.courierName,
        trackingNumber: null,
        deliveryStatus: "pending",
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
    const orderItems = items.map((item: OrderItem) => ({
      orderId,
      productId: item.productId || null,
      variantId: item.variantId || null,
      variantOptionId: item.variantOptionId || null,
      itemName: item.itemName,
      itemWeight: item.itemWeight,
      itemWidth: item.itemWidth,
      itemLength: item.itemLength,
      itemHeight: item.itemHeight,
      itemCurrency: item.itemCurrency,
      itemUnitPrice: item.itemUnitPrice,
      itemQuantity: item.itemQuantity,
      itemTotalPrice: item.itemUnitPrice * item.itemQuantity,
    }));

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
    const FAILURE_REDIRECT = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?status=error`;

    // 3. Create CHIP payload
    const chipPayload = {
      client: {
        email,
        full_name: fullName,
        phone: phoneNumber,
      },
      purchase: {
        products: [
          ...items.map((item: OrderItem) => ({
            name: item.itemName,
            price: Math.round(Number(item.itemUnitPrice || 0) * 100),
            quantity: item.itemQuantity,
          })),
          {
            name: "Shipping Fee",
            price: Math.round(Number(shippingFee || 0) * 100),
            quantity: 1,
          },
        ],
        currency: "MYR",
      },
      brand_id: CHIP_BRAND_ID,
      reference: orderData.orderNumber,
      send_receipt: true,
      platform: "web",
      success_redirect: SUCCESS_REDIRECT,
      failure_redirect: FAILURE_REDIRECT,
      ...(paymentMethod ? { payment_method_whitelist: [paymentMethod] } : {}),
    };

    // 4. Call CHIP
    let chipData;
    try {
      const chipResponse = await fetch(CHIP_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CHIP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chipPayload),
      });

      chipData = await chipResponse.json();

      if (!chipResponse.ok) {
        await supabase
          .from("orders")
          .update({
            paymentStatus: "failed",
            orderStatus: "cancelled_due_to_payment",
          })
          .eq("id", orderId);

        return NextResponse.json(
          { error: chipData.message || "Failed to create Chip purchase." },
          { status: chipResponse.status }
        );
      }
    } catch (err) {
      console.error("CHIP API error:", err);
      await supabase
        .from("orders")
        .update({
          paymentStatus: "failed",
          orderStatus: "cancelled_due_to_payment",
        })
        .eq("id", orderId);

      return NextResponse.json(
        { error: "Failed to call CHIP API" },
        { status: 500 }
      );
    }

    // 5. Update orders with CHIP purchase_id
    await supabase
      .from("orders")
      .update({
        chipPurchaseId: chipData?.id || null,
        paymentStatus: "pending",
        orderStatus: "awaiting_payment",
        paymentMethod: paymentMethod,
      })
      .eq("id", orderId)
      .select()
      .single();

    return NextResponse.json({
      orderId,
      orderNumber: orderData.orderNumber,
      success: true,
      checkout_url: chipData?.checkout_url || null,
      message: "Order created successfully!",
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";

    console.error("API Error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
