import { NextRequest, NextResponse } from "next/server";

const EASY_PARCEL_API_URL =
  "https://connect.easyparcel.my/?ac=EPRateCheckingBulk";
const EASY_PARCEL_API_KEY = process.env.EASYPARCEL_API_KEY!; // set EP-rAkk0XgHC in .env.local

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      pick_postcode,
      pick_state,
      send_postcode,
      send_state,
      weight,
      width,
      length,
      height,
    } = body;

    const payload = {
      api: EASY_PARCEL_API_KEY,
      bulk: [
        {
          pick_code: pick_postcode,
          pick_state: pick_state,
          pick_country: "MY",
          send_code: send_postcode,
          send_state: send_state,
          send_country: "MY",
          weight: weight,
          width: width || 0,
          length: length || 0,
          height: height || 0,
        },
      ],
    };

    const response = await fetch(EASY_PARCEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Extract only RM courier rates
    const rates = data?.result?.[0]?.rates || [];
    const simplifiedRates = rates.map((r: any) => ({
      courier: r.courier_name,
      service: r.service_id,
      price_rm: r.price,
    }));

    return NextResponse.json({ status: "success", rates: simplifiedRates });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
