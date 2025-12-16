import { NextRequest, NextResponse } from "next/server";

import { RateCheckingItem } from "@/types";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!; // set EP-rAkk0XgHC in .env.local
const EASYPARCEL_RATE_CHECKING_URL =
  process.env.EASYPARCEL_DEMO_RATE_CHECKING_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      pick_postcode,
      pick_state,
      pick_country,
      send_postcode,
      send_state,
      send_country,
      weight,
      width,
      length,
      height,
    } = body;

    if (
      !pick_postcode ||
      !pick_state ||
      !pick_country ||
      !send_postcode ||
      !send_state ||
      !send_country ||
      !weight
    ) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload = {
      api: EASYPARCEL_API_KEY,
      bulk: [
        {
          pick_code: String(pick_postcode),
          pick_state: String(pick_state),
          pick_country: String(pick_country || "MY"),
          send_code: String(send_postcode),
          send_state: String(send_state),
          send_country: String(send_country || "MY"),
          weight: Number(weight),
          width: Number(width) || 0,
          length: Number(length) || 0,
          height: Number(height) || 0,
        },
      ],
    };

    const response = await fetch(EASYPARCEL_RATE_CHECKING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    const allRates: RateCheckingItem[] =
      (data?.result?.[0]?.rates as RateCheckingItem[]) || [];

    const COURIER_PRIORITY = [
      "Poslaju National Courier",
      "J&T Express (Malaysia) Sdn. Bhd.",
      "DHL eCommerce",
      "Ninja Van", // //
      "City-Link Express (M) Sdn. Bhd.",
      "GDEX", // //
      "Skynet Express (M) Sdn. Bhd.",
      "Flash Malaysia Express Sdn. Bhd.",
      "SPX Xpress (Malaysia) Sdn Bhd",
      "Lazada Express (Malaysia) Sdn Bhd",
    ];

    const priorityCouriers = allRates.filter((r: RateCheckingItem) => {
      return COURIER_PRIORITY.some((name) =>
        r.courier_name?.toLowerCase().includes(name.toLowerCase())
      );
    });

    const effectiveRates =
      priorityCouriers.length > 0 ? priorityCouriers : allRates;

    const mappedRates = effectiveRates.map((response: RateCheckingItem) => {
      const base = Number(response.shipment_price || 0);
      const addons = Number(response.addon_price || 0); // includes sms/email/branding
      const price = (base || 0) + (addons || 0);

      return {
        rate_id: response.rate_id,
        courier: response.courier_name,
        service_id: response.service_id,
        service_name: response.service_name,
        price_rm: Number(price.toFixed(2)),
        original: response,
      };
    });

    return NextResponse.json({
      status: "success",
      rates: mappedRates,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
