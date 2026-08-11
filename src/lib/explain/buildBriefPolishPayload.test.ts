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
  });

  it("returns null when hikeBrief missing", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      weather: { source: "fallback" },
    });
    const without = { ...analysis, hikeBrief: undefined };
    expect(buildBriefPolishPayload(without)).toBeNull();
  });

  it("omits multi-model from polish brief payload", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      weather: {
        source: "open-meteo",
        temperatureC: 22,
        precipMm: 1,
        thunderstormRisk: "low",
        modelAgreement: {
          models: ["ecmwf", "gfs"],
          precipMm: [0.5, 2],
          level: "mixed",
          summary: "多模型略有差别（EC 偏干、GFS 偏湿）。",
        },
      },
    });
    const payload = buildBriefPolishPayload(analysis);
    expect(payload).toBeTruthy();
    expect(analysis.hikeBrief!.weatherBlocks.some((b) => b.label === "多模型")).toBe(
      true,
    );
    expect(payload!.brief.weatherBlocks.some((b) => b.label === "多模型")).toBe(
      false,
    );
    expect(payload!.brief.lead).not.toContain("多模型");
    expect(payload!.copyText).not.toContain("多模型");
  });
});
