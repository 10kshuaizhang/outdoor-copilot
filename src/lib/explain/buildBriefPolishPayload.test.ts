import { describe, expect, it } from "vitest";
import { analyzeRoute } from "@/lib/engine";
import { SHORT_CLIMB_POINTS } from "@/lib/engine/fixtures/shortClimb.points";
import { buildBriefPolishPayload } from "./buildBriefPolishPayload";

describe("buildBriefPolishPayload", () => {
  it("includes copyText and slim brief for LLM polish", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      title: "测试岭",
      weather: {
        source: "fallback",
        temperatureC: 22,
        precipMm: 2,
        thunderstormRisk: "low",
      },
    });
    const payload = buildBriefPolishPayload(analysis);
    expect(payload).toBeTruthy();
    expect(payload!.copyText.length).toBeGreaterThan(40);
    expect(payload!.brief.verdict).toBeTruthy();
    expect(payload!.brief.clothing.length).toBeGreaterThan(0);
    expect(payload!.route.distanceKm).toBeGreaterThan(0);
    expect(payload!.maxChars).toBeGreaterThan(200);
    expect(payload!.maxChars).toBeLessThan(1000);
  });

  it("returns null when hikeBrief missing", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      weather: { source: "fallback" },
    });
    const without = { ...analysis, hikeBrief: undefined };
    expect(buildBriefPolishPayload(without)).toBeNull();
  });
});
