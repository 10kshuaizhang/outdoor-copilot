import { describe, expect, it } from "vitest";
import { analyzeRoute } from "./analyzeRoute";
import { buildHikeBrief } from "./hikeBrief";
import type { TrackPoint } from "./types";

function climbPoints(): TrackPoint[] {
  const points: TrackPoint[] = [];
  for (let i = 0; i < 40; i++) {
    points.push({ lat: 40 + i * 0.00025, lon: 116, ele: 100 + i * 8 });
  }
  for (let i = 0; i < 20; i++) {
    points.push({ lat: 40.01 + i * 0.0002, lon: 116, ele: 420 - i * 5 });
  }
  return points;
}

describe("buildHikeBrief", () => {
  it("returns verdict, phases, feel, and copyText", () => {
    const result = analyzeRoute({
      points: climbPoints(),
      weather: {
        source: "fallback",
        temperatureC: 22,
        precipMm: 0,
        thunderstormRisk: "low",
        humidity: 45,
      },
      profile: { experience: "intermediate" },
    });

    expect(result.hikeBrief).toBeTruthy();
    const brief = result.hikeBrief!;
    expect(["go", "caution", "nogo"]).toContain(brief.verdict);
    expect(brief.verdictLabel.length).toBeGreaterThan(0);
    expect(brief.lead.length).toBeGreaterThan(0);
    expect(brief.weatherBlocks.length).toBeGreaterThanOrEqual(4);
    expect(brief.audience.novice).toBeTruthy();
    expect(brief.audience.experienced).toBeTruthy();
    expect(brief.phases.length).toBeGreaterThanOrEqual(3);
    expect(brief.copyText).toContain("降雨");
    expect(brief.copyText).toContain("穿衣");
    expect(brief.copyText).toContain("装备");
    expect(brief.copyText).toContain("出片");
    expect(brief.clothing.length).toBeGreaterThan(0);
    expect(brief.gear.length).toBeGreaterThan(0);
    expect(brief.photoTips.length).toBeGreaterThan(0);
    expect(brief.copyText).toContain("整体判断");
    expect(result.explanation.text).toBe(brief.copyText);
  });

  it("marks nogo when thunderstorm risk is high", () => {
    const result = analyzeRoute({
      points: climbPoints(),
      weather: {
        source: "open-meteo",
        temperatureC: 26,
        precipMm: 2,
        thunderstormRisk: "high",
      },
      profile: { experience: "intermediate" },
    });
    expect(result.hikeBrief?.verdict).toBe("nogo");
    expect(result.hikeBrief?.verdictLabel).toMatch(/不宜|不建议/);
    expect(result.hikeBrief?.audience.novice).toContain("不建议");
  });
});

describe("buildHikeBrief unit", () => {
  it("builds actionable copy without throwing", () => {
    const brief = buildHikeBrief({
      title: "东灵山",
      route: {
        distanceKm: 12,
        elevationGainM: 800,
        elevationLossM: 800,
        minElevM: 400,
        maxElevM: 1200,
        center: { lat: 40, lon: 115 },
      },
      segments: [
        {
          idx: 0,
          startKm: 0,
          endKm: 4,
          distanceM: 4000,
          gainM: 100,
          lossM: 20,
          avgGradePct: 2,
          maxGradePct: 8,
          estimatedEffort: 1.2,
          effortLabel: "easy",
        },
        {
          idx: 1,
          startKm: 4,
          endKm: 8,
          distanceM: 4000,
          gainM: 450,
          lossM: 30,
          avgGradePct: 11,
          maxGradePct: 22,
          estimatedEffort: 4.5,
          effortLabel: "hard_climb",
        },
        {
          idx: 2,
          startKm: 8,
          endKm: 12,
          distanceM: 4000,
          gainM: 50,
          lossM: 400,
          avgGradePct: -8,
          maxGradePct: 15,
          estimatedEffort: 0.8,
          effortLabel: "descent",
        },
      ],
      weather: {
        source: "open-meteo",
        temperatureC: 24,
        precipMm: 0,
        thunderstormRisk: "low",
        humidity: 50,
      },
      focus: {
        overall: 48,
        endurance: 45,
        climbing: 55,
        weather: 40,
        risk: 35,
      },
      duration: { lowMin: 280, highMin: 360 },
      mainRisk: "后程疲劳",
      suggestedStartLabel: "06:30",
      finishWindow: "12:00–13:30",
    });
    expect(brief.headline).toContain("东灵山");
    expect(brief.weatherBlocks.some((b) => b.label === "降雨")).toBe(true);
    expect(brief.phases.map((p) => p.label).join("|")).toMatch(/最难/);
    expect(brief.audience.novice.length).toBeGreaterThan(0);
  });

  it("keeps multi-model in report fields but omits it from copyText", () => {
    const brief = buildHikeBrief({
      title: "东灵山",
      route: {
        distanceKm: 12,
        elevationGainM: 800,
        elevationLossM: 800,
        minElevM: 400,
        maxElevM: 1200,
        center: { lat: 40, lon: 115 },
      },
      segments: [
        {
          idx: 0,
          startKm: 0,
          endKm: 12,
          distanceM: 12000,
          gainM: 800,
          lossM: 800,
          avgGradePct: 5,
          maxGradePct: 18,
          estimatedEffort: 2,
          effortLabel: "moderate",
        },
      ],
      weather: {
        source: "open-meteo",
        temperatureC: 24,
        precipMm: 0,
        thunderstormRisk: "low",
        humidity: 50,
        modelAgreement: {
          models: ["ecmwf", "gfs"],
          precipMm: [0.2, 1.5],
          level: "mixed",
          summary: "多模型略有差别（EC 偏干、GFS 偏湿）。",
        },
      },
      focus: {
        overall: 48,
        endurance: 45,
        climbing: 55,
        weather: 40,
        risk: 35,
      },
      duration: { lowMin: 280, highMin: 360 },
    });

    expect(brief.weatherBlocks.some((b) => b.label === "多模型")).toBe(true);
    expect(brief.lead).toContain("多模型略有差别");
    expect(brief.copyText).not.toContain("多模型");
    expect(brief.copyText).not.toContain("GFS");
    expect(brief.copyText).toContain("降雨");
  });
});
