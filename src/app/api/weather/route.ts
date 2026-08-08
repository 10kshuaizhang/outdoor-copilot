import { NextRequest, NextResponse } from "next/server";

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
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("daily", "sunrise,sunset,precipitation_sum,temperature_2m_max,windspeed_10m_max");
    url.searchParams.set("timezone", "Asia/Shanghai");
    url.searchParams.set("start_date", date);
    url.searchParams.set("end_date", date);

    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = (await res.json()) as {
      daily?: {
        time?: string[];
        sunrise?: string[];
        sunset?: string[];
        precipitation_sum?: number[];
        temperature_2m_max?: number[];
        windspeed_10m_max?: number[];
      };
    };

    const daily = data.daily;
    const temperatureC = daily?.temperature_2m_max?.[0];
    const precipMm = daily?.precipitation_sum?.[0];
    const windMs = daily?.windspeed_10m_max?.[0];

    return NextResponse.json({
      date,
      lat,
      lon,
      temperatureC: temperatureC ?? 18,
      precipMm: precipMm ?? 0,
      windMs: windMs ?? 0,
      thunderstormRisk:
        (precipMm ?? 0) >= 10 ? "medium" : ("low" as const),
      sunrise: daily?.sunrise?.[0],
      sunset: daily?.sunset?.[0],
      source: "open-meteo",
    });
  } catch {
    return NextResponse.json({
      date,
      lat,
      lon,
      temperatureC: 18,
      precipMm: 0,
      windMs: 2,
      thunderstormRisk: "unknown",
      source: "fallback",
    });
  }
}
