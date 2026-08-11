import type { WeatherSnapshot } from "@/lib/engine/types";

/** Open-Meteo daily block (subset we request). */
export type OpenMeteoDaily = {
  time?: string[];
  sunrise?: string[];
  sunset?: string[];
  precipitation_sum?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  wind_speed_10m_max?: number[];
  /** Legacy alias still accepted by Open-Meteo */
  windspeed_10m_max?: number[];
  weather_code?: number[];
  relative_humidity_2m_max?: number[];
  uv_index_max?: number[];
};

export type OpenMeteoHourly = {
  time?: string[];
  precipitation?: number[];
  weather_code?: number[];
  cloud_cover?: number[];
  visibility?: number[];
};

export type ModelPrecipSample = {
  model: string;
  label: string;
  precipMm: number;
};

/**
 * WMO weather interpretation codes used by Open-Meteo.
 * @see https://open-meteo.com/en/docs
 */
export function thunderstormFromWeatherCode(
  code: number | undefined,
): WeatherSnapshot["thunderstormRisk"] {
  if (code == null || !Number.isFinite(code)) return "unknown";
  if (code === 95 || code === 96 || code === 99) return "high";
  // Heavy rain / violent rain showers often accompany convective risk
  if (code === 82 || code === 67) return "medium";
  return "low";
}

/** Open-Meteo daily wind maxima are km/h — store as m/s for the engine. */
export function kmhToMs(kmh: number | undefined): number | undefined {
  if (kmh == null || !Number.isFinite(kmh)) return undefined;
  return Number((kmh / 3.6).toFixed(2));
}

/** Find the wettest consecutive window and label it in China local clock. */
export function summarizeRainWindow(
  hourly?: OpenMeteoHourly,
  opts?: { startMs?: number; endMs?: number },
): {
  rainWindow?: string;
  peakHourPrecipMm?: number;
  meanCloudCover?: number;
  visibilityKm?: number;
} {
  if (!hourly?.time?.length || !hourly.precipitation?.length) return {};
  const times = hourly.time;
  const precip = hourly.precipitation;
  const n = Math.min(times.length, precip.length);
  const scoped = opts?.startMs != null || opts?.endMs != null;

  const indices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!scoped) {
      indices.push(i);
      continue;
    }
    const raw = times[i];
    if (!raw) continue;
    const base = raw.length >= 16 ? raw.slice(0, 16) : raw;
    const ms = /[zZ]|[+-]\d{2}:\d{2}$/.test(raw)
      ? Date.parse(raw)
      : Date.parse(`${base}:00+08:00`);
    if (!Number.isFinite(ms)) continue;
    if (opts?.startMs != null && ms + 60 * 60 * 1000 <= opts.startMs) continue;
    if (opts?.endMs != null && ms >= opts.endMs) continue;
    indices.push(i);
  }

  if (!indices.length) {
    // Fall back to full series if the hike window missed all hours.
    for (let i = 0; i < n; i++) indices.push(i);
  }

  let bestStartIdx = indices[0]!;
  let bestSum = -1;
  const window = Math.min(3, indices.length);
  for (let a = 0; a <= indices.length - window; a++) {
    let sum = 0;
    for (let b = 0; b < window; b++) {
      sum += precip[indices[a + b]!] ?? 0;
    }
    if (sum > bestSum) {
      bestSum = sum;
      bestStartIdx = indices[a]!;
    }
  }

  const peak = Math.max(...indices.map((i) => precip[i] ?? 0), 0);
  const start = times[bestStartIdx]?.slice(11, 16) ?? "";
  const endPos = indices.indexOf(bestStartIdx);
  const endIdx =
    endPos >= 0
      ? indices[Math.min(endPos + Math.max(window - 1, 0), indices.length - 1)]!
      : bestStartIdx;
  const end = times[endIdx]?.slice(11, 16) ?? "";

  let meanCloud: number | undefined;
  if (hourly.cloud_cover?.length) {
    const vals = indices
      .map((i) => hourly.cloud_cover?.[i])
      .filter((v): v is number => typeof v === "number");
    if (vals.length) {
      meanCloud = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
  }

  let visibilityKm: number | undefined;
  if (hourly.visibility?.length) {
    const vals = indices
      .map((i) => hourly.visibility?.[i])
      .filter((v): v is number => typeof v === "number" && v > 0);
    if (vals.length) {
      const meanM = vals.reduce((a, b) => a + b, 0) / vals.length;
      visibilityKm = Number((meanM / 1000).toFixed(1));
    }
  }

  return {
    rainWindow:
      bestSum >= 0.5 && start && end
        ? `${scoped ? "你这段行程内" : ""}相对较湿时段大约 ${start}–${end}（3小时窗，单点粗估）`.trim()
        : bestSum > 0
          ? scoped
            ? "行程时段内降水偏零散，无明显连续强降雨"
            : "降水偏零散，无明显连续强降雨时段"
          : scoped
            ? "行程时段内无明显降水峰值"
            : undefined,
    peakHourPrecipMm: peak > 0 ? Number(peak.toFixed(1)) : undefined,
    meanCloudCover: meanCloud,
    visibilityKm,
  };
}

export function summarizeModelAgreement(
  samples: ModelPrecipSample[],
): WeatherSnapshot["modelAgreement"] {
  if (samples.length < 2) {
    return {
      models: samples.map((s) => s.label),
      precipMm: samples.map((s) => s.precipMm),
      level: "unknown",
      summary: "仅单一预报源，无法做多模型对照。",
    };
  }
  const vals = samples.map((s) => s.precipMm);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const spread = max - min;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const detail = samples
    .map((s) => `${s.label} ${s.precipMm.toFixed(1)}mm`)
    .join(" / ");

  if (spread <= 2 || (mean < 1 && max < 3)) {
    return {
      models: samples.map((s) => s.label),
      precipMm: vals,
      level: "aligned",
      summary: `多模型较一致（${detail}）。`,
    };
  }
  if (spread >= 8 || (min < 2 && max >= 10)) {
    return {
      models: samples.map((s) => s.label),
      precipMm: vals,
      level: "divergent",
      summary: `多模型分歧偏大（${detail}）；以更湿的一侧保守决策。`,
    };
  }
  return {
    models: samples.map((s) => s.label),
    precipMm: vals,
    level: "mixed",
    summary: `多模型略有差别（${detail}）。`,
  };
}

export function mapOpenMeteoDaily(input: {
  date: string;
  lat: number;
  lon: number;
  daily?: OpenMeteoDaily;
  hourly?: OpenMeteoHourly;
  modelSamples?: ModelPrecipSample[];
}): WeatherSnapshot {
  const daily = input.daily;
  const temperatureC = daily?.temperature_2m_max?.[0];
  const temperatureMinC = daily?.temperature_2m_min?.[0];
  const precipMm = daily?.precipitation_sum?.[0];
  const windKmh =
    daily?.wind_speed_10m_max?.[0] ?? daily?.windspeed_10m_max?.[0];
  const humidity = daily?.relative_humidity_2m_max?.[0];
  const weatherCode = daily?.weather_code?.[0];
  const uvIndexMax = daily?.uv_index_max?.[0];

  let thunderstormRisk = thunderstormFromWeatherCode(weatherCode);
  // If code missing, fall back to precip heuristic
  if (thunderstormRisk === "unknown" && precipMm != null) {
    thunderstormRisk =
      precipMm >= 25 ? "high" : precipMm >= 10 ? "medium" : "low";
  }

  const rain = summarizeRainWindow(input.hourly);
  const modelAgreement = input.modelSamples?.length
    ? summarizeModelAgreement(input.modelSamples)
    : undefined;

  // If models diverge wet, bump storm risk one notch when previously low.
  let risk = thunderstormRisk;
  if (
    modelAgreement?.level === "divergent" &&
    Math.max(...(modelAgreement.precipMm ?? [0])) >= 8 &&
    risk === "low"
  ) {
    risk = "medium";
  }

  return {
    date: input.date,
    lat: input.lat,
    lon: input.lon,
    temperatureC: temperatureC ?? 18,
    temperatureMinC:
      temperatureMinC != null && Number.isFinite(temperatureMinC)
        ? temperatureMinC
        : undefined,
    precipMm: precipMm ?? 0,
    windMs: kmhToMs(windKmh) ?? 0,
    humidity:
      humidity != null && Number.isFinite(humidity) ? humidity : undefined,
    thunderstormRisk: risk,
    sunrise: daily?.sunrise?.[0],
    sunset: daily?.sunset?.[0],
    uvIndexMax:
      uvIndexMax != null && Number.isFinite(uvIndexMax)
        ? Number(uvIndexMax.toFixed(1))
        : undefined,
    rainWindow: rain.rainWindow,
    peakHourPrecipMm: rain.peakHourPrecipMm,
    cloudCoverPct: rain.meanCloudCover,
    visibilityKm: rain.visibilityKm,
    hourlyTimes: input.hourly?.time?.length
      ? [...input.hourly.time]
      : undefined,
    hourlyPrecipMm: input.hourly?.precipitation?.length
      ? [...input.hourly.precipitation]
      : undefined,
    modelAgreement,
    source: "open-meteo",
  };
}

const DAILY_FIELDS = [
  "sunrise",
  "sunset",
  "precipitation_sum",
  "temperature_2m_max",
  "temperature_2m_min",
  "wind_speed_10m_max",
  "weather_code",
  "relative_humidity_2m_max",
  "uv_index_max",
].join(",");

const HOURLY_FIELDS = [
  "precipitation",
  "weather_code",
  "cloud_cover",
  "visibility",
].join(",");

export function openMeteoForecastUrl(input: {
  lat: number;
  lon: number;
  date: string;
  /** Inclusive end date (defaults to `date`). Use next day for overnight hikes. */
  endDate?: string;
  model?: string;
  includeHourly?: boolean;
}): string {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(input.lat));
  url.searchParams.set("longitude", String(input.lon));
  url.searchParams.set("daily", DAILY_FIELDS);
  if (input.includeHourly) {
    url.searchParams.set("hourly", HOURLY_FIELDS);
  }
  if (input.model) {
    url.searchParams.set("models", input.model);
  }
  url.searchParams.set("timezone", "Asia/Shanghai");
  url.searchParams.set("start_date", input.date);
  url.searchParams.set("end_date", input.endDate ?? input.date);
  return url.toString();
}

/** Models used for precip cross-check (Open-Meteo ids). */
export const WEATHER_COMPARE_MODELS: Array<{ id: string; label: string }> = [
  { id: "best_match", label: "综合" },
  { id: "ecmwf_ifs025", label: "ECMWF" },
  { id: "gfs_seamless", label: "GFS" },
  { id: "icon_seamless", label: "ICON" },
];

export async function fetchOpenMeteoSnapshot(input: {
  lat: number;
  lon: number;
  date: string;
  /** Inclusive end date for overnight coverage. */
  endDate?: string;
  fetchImpl?: typeof fetch;
}): Promise<WeatherSnapshot> {
  const fetchFn = input.fetchImpl ?? fetch;
  const endDate = input.endDate ?? input.date;

  const primaryUrl = openMeteoForecastUrl({
    lat: input.lat,
    lon: input.lon,
    date: input.date,
    endDate,
    includeHourly: true,
  });
  const primaryRes = await fetchFn(primaryUrl, { next: { revalidate: 1800 } });
  if (!primaryRes.ok) throw new Error(`open-meteo ${primaryRes.status}`);
  const primary = (await primaryRes.json()) as {
    daily?: OpenMeteoDaily;
    hourly?: OpenMeteoHourly;
  };

  const modelSamples: ModelPrecipSample[] = [];
  await Promise.all(
    WEATHER_COMPARE_MODELS.map(async (m) => {
      try {
        const url = openMeteoForecastUrl({
          lat: input.lat,
          lon: input.lon,
          date: input.date,
          endDate,
          model: m.id === "best_match" ? undefined : m.id,
        });
        const res = await fetchFn(url, { next: { revalidate: 1800 } });
        if (!res.ok) return;
        const data = (await res.json()) as { daily?: OpenMeteoDaily };
        const precip = data.daily?.precipitation_sum?.[0];
        if (precip == null || !Number.isFinite(precip)) return;
        modelSamples.push({
          model: m.id,
          label: m.label,
          precipMm: Number(precip),
        });
      } catch {
        // ignore single-model failure
      }
    }),
  );

  // Prefer primary daily precip; if missing, use median of models.
  if (
    (primary.daily?.precipitation_sum?.[0] == null ||
      !Number.isFinite(primary.daily.precipitation_sum[0])) &&
    modelSamples.length
  ) {
    const sorted = [...modelSamples.map((s) => s.precipMm)].sort(
      (a, b) => a - b,
    );
    const mid = sorted[Math.floor(sorted.length / 2)];
    primary.daily = {
      ...(primary.daily ?? {}),
      precipitation_sum: [mid],
    };
  }

  return mapOpenMeteoDaily({
    date: input.date,
    lat: input.lat,
    lon: input.lon,
    daily: primary.daily,
    hourly: primary.hourly,
    modelSamples,
  });
}
