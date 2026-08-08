import { describe, expect, it } from "vitest";
import {
  kmhToMs,
  mapOpenMeteoDaily,
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
        precipitation_sum: [0],
        wind_speed_10m_max: [12.6],
        weather_code: [1],
        relative_humidity_2m_max: [94],
        sunrise: ["2026-08-09T05:20"],
        sunset: ["2026-08-09T19:22"],
      },
    });
    expect(snap.source).toBe("open-meteo");
    expect(snap.temperatureC).toBe(27.6);
    expect(snap.windMs).toBe(3.5);
    expect(snap.humidity).toBe(94);
    expect(snap.thunderstormRisk).toBe("low");
    expect(snap.sunset).toContain("19:22");
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
});
