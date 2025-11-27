import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // // 1. Insert order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        orderNumber: "ORD-" + Date.now(), // // simple order number
        fullName: body.fullName,
        email: body.email,
        phoneNumber: body.phoneNumber,
        address: body.address,
        totalPrice: body.totalPrice,
        shippingFee: body.shippingFee,
        courierName: body.courierName,
        paymentMethod: body.paymentMethod,
      })
      .select()
      .single();

    if (orderError || !orderData) {
      return NextResponse.json(
        { error: orderError?.message || "Failed to create order" },
        { status: 500 }
      );
    }

    const orderId = orderData.id;

    // // 2. Insert order items
    const items = body.items.map((item: any) => ({
      orderId,
      productId: item.productId,
      variantId: item.variantId,
      variantOptionId: item.variantOptionId,
      itemName: item.itemName,
      itemUnitPrice: item.itemUnitPrice,
      itemQuantity: item.itemQuantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Order created", orderId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
