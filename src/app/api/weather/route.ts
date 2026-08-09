import { NextRequest, NextResponse } from "next/server";
import { fallbackWeather } from "@/lib/engine/weatherAdjust";
import { fetchOpenMeteoSnapshot } from "@/lib/weather/openMeteo";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "lat/lon required", source: "fallback" },
      { status: 400 },
    );
  }

  try {
    const snap = await fetchOpenMeteoSnapshot({ lat, lon, date });
    return NextResponse.json(snap);
  } catch {
    return NextResponse.json(fallbackWeather(lat, lon, date));
  }
}
