import { NextRequest, NextResponse } from "next/server";
import { fallbackWeather } from "@/lib/engine/weatherAdjust";
import {
  mapOpenMeteoDaily,
  openMeteoForecastUrl,
  type OpenMeteoDaily,
} from "@/lib/weather/openMeteo";

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
    const res = await fetch(openMeteoForecastUrl({ lat, lon, date }), {
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = (await res.json()) as { daily?: OpenMeteoDaily };
    if (!data.daily?.time?.length && data.daily?.temperature_2m_max == null) {
      // Some error payloads omit daily; treat as failure
      if (!data.daily) throw new Error("open-meteo empty daily");
    }

    return NextResponse.json(
      mapOpenMeteoDaily({ date, lat, lon, daily: data.daily }),
    );
  } catch {
    return NextResponse.json(fallbackWeather(lat, lon, date));
  }
}
