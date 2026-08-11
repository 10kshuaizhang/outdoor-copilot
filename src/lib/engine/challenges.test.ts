import { describe, expect, it } from "vitest";
import { formatShanghaiClock, shanghaiWallIso } from "@/lib/time/china";
import { analyzeRoute } from "./analyzeRoute";
import {
  buildRecommendation,
  estimateWaterPlan,
  parseChinaDayTime,
} from "./challenges";
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
        sunrise: "2026-08-08T05:20",
        sunset: "2026-08-08T19:05",
      },
    });
    expect(formatShanghaiClock(rec.suggestedStart)).toBe("07:30");
    expect(rec.finishWindow).toMatch(/^10:\d{2}–11:\d{2}$/);
    expect(rec.mainRisk).not.toBe("可能天黑前无法结束");
  });

  it("flags daytime starts that finish after sunset as darkness overrun", () => {
    const rec = buildRecommendation({
      durationMin: 360,
      personalOverall: 40,
      plannedStart: "2026-08-08T08:00:00.000Z", // 16:00 Shanghai
      weather: {
        source: "fallback",
        date: "2026-08-08",
        temperatureC: 18,
        sunrise: "2026-08-08T05:20",
        sunset: "2026-08-08T19:05",
        thunderstormRisk: "low",
      },
    });
    expect(rec.mainRisk).toBe("可能天黑前无法结束");
  });

  it("treats late-night planned starts as night hiking, not sunset overrun", () => {
    const rec = buildRecommendation({
      durationMin: 280,
      personalOverall: 50,
      plannedStart: "2026-08-08T15:30:00.000Z", // 23:30 Shanghai
      weather: {
        source: "fallback",
        date: "2026-08-08",
        temperatureC: 12,
        sunrise: "2026-08-08T05:20",
        sunset: "2026-08-08T19:05",
        thunderstormRisk: "low",
      },
    });
    expect(formatShanghaiClock(rec.suggestedStart)).toBe("23:30");
    expect(rec.mainRisk).toBe("夜间行进（需头灯）");
    expect(rec.mainRisk).not.toBe("可能天黑前无法结束");
    expect(rec.paceNote).toMatch(/夜行/);
  });

  it("labels pre-dawn starts without calling them sunset overrun", () => {
    const rec = buildRecommendation({
      durationMin: 180,
      personalOverall: 40,
      plannedStart: "2026-08-07T20:00:00.000Z", // 04:00 Shanghai
      weather: {
        source: "fallback",
        date: "2026-08-08",
        temperatureC: 10,
        sunrise: "2026-08-08T05:20",
        sunset: "2026-08-08T19:05",
        thunderstormRisk: "low",
      },
    });
    expect(formatShanghaiClock(rec.suggestedStart)).toBe("04:00");
    expect(rec.mainRisk).toBe("凌晨出发，前段需头灯");
  });

  it("does not call a 07:30–10:30 hike overnight even if sunrise ISO is skewed", () => {
    const planned = shanghaiWallIso("2026-08-11", 7, 30);
    const cases = [
      "2026-08-11T05:23",
      "2026-08-11T05:23:00.000Z", // wall digits mis-tagged as UTC
      "2026-08-12T05:23", // next-day sunrise from overnight fetch
    ];
    for (const sunrise of cases) {
      const rec = buildRecommendation({
        durationMin: 160,
        personalOverall: 35,
        plannedStart: planned,
        weather: {
          source: "open-meteo",
          date: "2026-08-11",
          temperatureC: 18,
          sunrise,
          sunset: "2026-08-11T19:20",
          thunderstormRisk: "low",
        },
      });
      expect(formatShanghaiClock(rec.suggestedStart)).toBe("07:30");
      expect(rec.mainRisk).not.toMatch(/夜间|凌晨|天黑/);
      expect(rec.mainRisk).toBe("后程疲劳");
    }
  });

  it("parses sunrise wall-clock digits as China local even with a trailing Z", () => {
    const rise = parseChinaDayTime("2026-08-11T05:23:00.000Z");
    expect(rise).not.toBeNull();
    expect(formatShanghaiClock(rise!.toISOString())).toBe("05:23");
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
