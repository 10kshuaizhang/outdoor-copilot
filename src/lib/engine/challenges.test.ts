import { describe, expect, it } from "vitest";
import { formatShanghaiClock } from "@/lib/time/china";
import { analyzeRoute } from "./analyzeRoute";
import { buildRecommendation } from "./challenges";
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
});
