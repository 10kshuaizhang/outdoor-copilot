import { describe, expect, it } from "vitest";
import { formatShanghaiClock } from "@/lib/time/china";
import { analyzeRoute } from "./analyzeRoute";
import { buildRecommendation, estimateWaterPlan } from "./challenges";
import { parseGpx } from "./parseGpx";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("challenges", () => {
  it("keeps challenge kilometer ranges inside the route length", () => {
    const xml = readFileSync(
      path.resolve(import.meta.dirname, "../../../public/samples/daheifeng.gpx"),
      "utf8",
    );
    const result = analyzeRoute({
      points: parseGpx(xml),
      weather: { source: "fallback", temperatureC: 30 },
    });
    for (const c of result.challenges) {
      expect(c.startKm).toBeGreaterThanOrEqual(0);
      expect(c.endKm).toBeLessThanOrEqual(result.route.distanceKm + 0.05);
      expect(c.endKm).toBeGreaterThanOrEqual(c.startKm);
    }
  });

  it("suggests a morning Shanghai start, not UTC 23:30 on the clock", () => {
    const rec = buildRecommendation({
      durationMin: 211,
      personalOverall: 32,
      weather: {
        source: "fallback",
        date: "2026-08-08",
        temperatureC: 18,
        sunset: "2026-08-08T19:05",
      },
    });
    expect(formatShanghaiClock(rec.suggestedStart)).toBe("07:30");
    expect(rec.finishWindow).toMatch(/^10:\d{2}–11:\d{2}$/);
    expect(rec.mainRisk).not.toBe("可能天黑前无法结束");
  });

  it("splits water consume vs carry and caps trailhead load", () => {
    const cool = estimateWaterPlan({
      durationMin: 180,
      temperatureC: 18,
      elevationGainM: 600,
    });
    expect(cool.carryLiters).toBeGreaterThanOrEqual(1.5);
    expect(cool.carryLiters).toBeLessThanOrEqual(2.5);
    expect(cool.consumeLiters).toBeLessThanOrEqual(3);

    // Old bug: 11h × 0.7 ≈ 7.7 L as "建议饮水"
    const longHot = estimateWaterPlan({
      durationMin: 11 * 60,
      temperatureC: 29,
      elevationGainM: 2100,
    });
    expect(longHot.consumeLiters).toBeGreaterThan(longHot.carryLiters);
    expect(longHot.carryLiters).toBeLessThanOrEqual(3.5);
    expect(longHot.carryLiters).toBeLessThan(5);
    expect(longHot.note).toMatch(/携行|补水/);

    const rec = buildRecommendation({
      durationMin: 11 * 60,
      personalOverall: 80,
      elevationGainM: 2100,
      weather: {
        source: "open-meteo",
        temperatureC: 29,
        thunderstormRisk: "low",
      },
    });
    expect(rec.waterLiters).toBe(rec.waterCarryLiters);
    expect(rec.waterCarryLiters!).toBeLessThanOrEqual(3.5);
    expect(rec.waterConsumeLiters!).toBeGreaterThan(rec.waterCarryLiters!);
  });
});
