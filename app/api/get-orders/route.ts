import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");

  if (!orderNumber) {
    return NextResponse.json(
      { error: "Missing order number" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      easyparcelOrderNumber,
      orderNumber,
      subTotalPrice,
      shippingFee,
      totalPrice,
      trackingNumber,
      trackingUrl,
      awbNumber,
       awbPdfUrl,
      deliveryStatus,
      order_items (
        id,
        itemSrc,
        itemName,
        itemQuantity,
        itemTotalPrice
      )
    `
    )
    .eq("orderNumber", orderNumber)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
