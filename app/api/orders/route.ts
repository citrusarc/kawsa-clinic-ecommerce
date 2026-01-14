import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/utils/neon/client";
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

    // 1. Create order using Neon SQL
    const orderData = await sql`
      INSERT INTO orders (
        "orderNumber",
        "fullName",
        email,
        "phoneNumber",
        "addressLine1",
        "addressLine2",
        city,
        state,
        postcode,
        country,
        "subTotalPrice",
        "shippingFee",
        "totalPrice",
        "paymentMethod",
        "paymentStatus",
        "rateId",
        "serviceId",
        "serviceName",
        "courierId",
        "courierName",
        "trackingNumber",
        "deliveryStatus",
        "orderStatus"
      ) VALUES (
        ${"ORD-" + Date.now()},
        ${fullName},
        ${email},
        ${phoneNumber},
        ${addressLine1},
        ${addressLine2},
        ${city},
        ${state},
        ${postcode},
        ${country},
        ${subTotalPrice},
        ${shippingFee},
        ${totalPrice},
        ${paymentMethod},
        'pending',
        ${easyparcel?.rateId || null},
        ${easyparcel?.serviceId || null},
        ${easyparcel?.serviceName || null},
        ${easyparcel?.courierId || null},
        ${easyparcel?.courierName || null},
        NULL,
        'pending',
        'pending'
      )
      RETURNING *
    `;

    if (!orderData || orderData.length === 0) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    const order = orderData[0];
    const orderId = order.id;

    // 2. Insert order items using Neon SQL
    for (const item of items) {
      await sql`
        INSERT INTO order_items (
          "orderId",
          "productId",
          "variantId",
          "variantOptionId",
          "itemSrc",
          "itemName",
          "itemWeight",
          "itemWidth",
          "itemLength",
          "itemHeight",
          "itemCurrency",
          "itemUnitPrice",
          "itemQuantity",
          "itemTotalPrice"
        ) VALUES (
          ${orderId},
          ${item.productId || null},
          ${item.variantId || null},
          ${item.variantOptionId || null},
          ${item.itemSrc},
          ${item.itemName},
          ${item.itemWeight},
          ${item.itemWidth},
          ${item.itemLength},
          ${item.itemHeight},
          ${item.itemCurrency},
          ${item.itemUnitPrice},
          ${item.itemQuantity},
          ${item.itemUnitPrice * item.itemQuantity}
        )
      `;
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
      reference: order.orderNumber,
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
        await sql`
          UPDATE orders
          SET "paymentStatus" = 'failed',
              "orderStatus" = 'cancelled_due_to_payment'
          WHERE id = ${orderId}
        `;
        return NextResponse.json(
          { error: chipData.message || "Failed to create Chip purchase." },
          { status: chipResponse.status }
        );
      }
    } catch (err) {
      console.error("CHIP API error:", err);
      await sql`
        UPDATE orders
        SET "paymentStatus" = 'failed',
            "orderStatus" = 'cancelled_due_to_payment'
        WHERE id = ${orderId}
      `;
      return NextResponse.json(
        { error: "Failed to call CHIP API" },
        { status: 500 }
      );
    }

    // 5. Update orders with CHIP purchase_id using Neon SQL
    await sql`
      UPDATE orders
      SET "chipPurchaseId" = ${chipData?.id || null},
          "paymentStatus" = 'pending',
          "orderStatus" = 'awaiting_payment',
          "paymentMethod" = ${paymentMethod}
      WHERE id = ${orderId}
    `;

    return NextResponse.json({
      orderId,
      orderNumber: order.orderNumber,
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
