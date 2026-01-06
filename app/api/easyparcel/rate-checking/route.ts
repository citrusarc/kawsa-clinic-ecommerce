import { NextRequest, NextResponse } from "next/server";

import { RateCheckingItem } from "@/types";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_DEMO_API_KEY!;
const EASYPARCEL_RATE_CHECKING_URL =
  process.env.EASYPARCEL_DEMO_RATE_CHECKING_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      pickPostcode,
      pickState,
      pickCountry,
      sendPostcode,
      sendState,
      sendCountry,
      weight,
      width,
      length,
      height,
    } = body;

    if (sendCountry !== "MY") {
      return NextResponse.json(
        { status: "error", message: "Only Malaysia shipping supported" },
        { status: 400 }
      );
    }

    if (
      !pickPostcode ||
      !pickState ||
      !pickCountry ||
      !sendPostcode ||
      !sendState ||
      !sendCountry ||
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
          pick_code: String(pickPostcode),
          pick_state: String(pickState),
          pick_country: String(pickCountry || "MY"),
          send_code: String(sendPostcode),
          send_state: String(sendState),
          send_country: String(sendCountry || "MY"),
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

    const priorityCouriers = [
      "Poslaju National Courier",
      "J&T Express (Malaysia) Sdn. Bhd.",
      "DHL eCommerce",
      "Ninja Logistics Sdn Bhd",
      "Flash Malaysia Express Sdn. Bhd.",
      "KEX Express",
      "Skynet Express (M) Sdn. Bhd.",
      "Federal Express Services (M) Sdn Bhd",
      "City-Link Express (M) Sdn. Bhd.",
      "SPX Xpress (Malaysia) Sdn Bhd",
      "Lazada Express (Malaysia) Sdn Bhd",
    ];

    const priorityCouriersAllRates = allRates.filter((r: RateCheckingItem) => {
      return priorityCouriers.some((name) =>
        r.courier_name?.toLowerCase().includes(name.toLowerCase())
      );
    });

    const priorityCouriersRates =
      priorityCouriersAllRates.length > 0 ? priorityCouriersAllRates : allRates;

    const courierRates = priorityCouriersRates.map(
      (response: RateCheckingItem) => {
        const shipmentRates = Number(response.shipment_price || 0);
        const addOnRates = Number(response.addon_price || 0); // includes sms/email/branding/whatsapp
        const shipmentTotalRates = shipmentRates + addOnRates;

        return {
          rateId: response.rate_id,
          serviceId: response.service_id,
          serviceName: response.service_name,
          courierId: response.courier_id,
          courierName: response.courier_name,
          shipmentTotalRates: Number(shipmentTotalRates.toFixed(2)),
        };
      }
    );

    return NextResponse.json({
      status: "success",
      rates: courierRates,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
