import { describe, expect, it } from "vitest";
import {
  kmhToMs,
  mapOpenMeteoDaily,
  summarizeModelAgreement,
  summarizeRainWindow,
  thunderstormFromWeatherCode,
} from "./openMeteo";

describe("openMeteo mapping", () => {
  it("converts wind from km/h to m/s", () => {
    expect(kmhToMs(36)).toBe(10);
    expect(kmhToMs(12.6)).toBe(3.5);
  });

  it("maps thunderstorm WMO codes", () => {
    expect(thunderstormFromWeatherCode(95)).toBe("high");
    expect(thunderstormFromWeatherCode(1)).toBe("low");
    expect(thunderstormFromWeatherCode(undefined)).toBe("unknown");
  });

  it("builds a real open-meteo snapshot from daily fields", () => {
    const snap = mapOpenMeteoDaily({
      date: "2026-08-09",
      lat: 40.5,
      lon: 116,
      daily: {
        temperature_2m_max: [27.6],
        temperature_2m_min: [18.2],
        precipitation_sum: [0],
        wind_speed_10m_max: [12.6],
        weather_code: [1],
        relative_humidity_2m_max: [94],
        uv_index_max: [8.2],
        sunrise: ["2026-08-09T05:20"],
        sunset: ["2026-08-09T19:22"],
      },
      hourly: {
        time: [
          "2026-08-09T12:00",
          "2026-08-09T13:00",
          "2026-08-09T14:00",
        ],
        precipitation: [0, 0, 0],
        cloud_cover: [30, 40, 35],
        visibility: [20000, 18000, 22000],
      },
      modelSamples: [
        { model: "ecmwf_ifs025", label: "ECMWF", precipMm: 0.2 },
        { model: "gfs_seamless", label: "GFS", precipMm: 0.5 },
        { model: "icon_seamless", label: "ICON", precipMm: 0 },
      ],
    });
    expect(snap.source).toBe("open-meteo");
    expect(snap.temperatureC).toBe(27.6);
    expect(snap.temperatureMinC).toBe(18.2);
    expect(snap.windMs).toBe(3.5);
    expect(snap.humidity).toBe(94);
    expect(snap.uvIndexMax).toBe(8.2);
    expect(snap.thunderstormRisk).toBe("low");
    expect(snap.sunset).toContain("19:22");
    expect(snap.modelAgreement?.level).toBe("aligned");
    expect(snap.visibilityKm).toBeGreaterThan(10);
  });

  it("uses weather_code 95 as high thunderstorm risk", () => {
    const snap = mapOpenMeteoDaily({
      date: "2026-08-09",
      lat: 40.5,
      lon: 116,
      daily: {
        temperature_2m_max: [30],
        precipitation_sum: [5],
        wind_speed_10m_max: [20],
        weather_code: [95],
      },
    });
    expect(snap.thunderstormRisk).toBe("high");
  });

  it("summarizes rain windows and model agreement", () => {
    const rain = summarizeRainWindow({
      time: [
        "2026-08-09T10:00",
        "2026-08-09T11:00",
        "2026-08-09T12:00",
        "2026-08-09T13:00",
        "2026-08-09T14:00",
      ],
      precipitation: [0, 0.2, 3, 4, 0.5],
      cloud_cover: [40, 50, 70, 80, 60],
      visibility: [20000, 18000, 9000, 8000, 12000],
    });
    expect(rain.rainWindow).toMatch(/12:00/);
    expect(rain.peakHourPrecipMm).toBe(4);

    const agree = summarizeModelAgreement([
      { model: "a", label: "ECMWF", precipMm: 1 },
      { model: "b", label: "GFS", precipMm: 1.5 },
      { model: "c", label: "ICON", precipMm: 0.8 },
    ]);
    expect(agree?.level).toBe("aligned");

    const diverge = summarizeModelAgreement([
      { model: "a", label: "ECMWF", precipMm: 1 },
      { model: "b", label: "GFS", precipMm: 18 },
    ]);
    expect(diverge?.level).toBe("divergent");
  });
});
