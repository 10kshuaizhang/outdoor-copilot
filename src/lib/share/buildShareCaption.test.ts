import { describe, expect, it } from "vitest";
import { analyzeRoute } from "@/lib/engine";
import { SHORT_CLIMB_POINTS } from "@/lib/engine/fixtures/shortClimb.points";
import { buildShareCaption } from "./buildShareCaption";

describe("buildShareCaption", () => {
  it("prefers polished hike brief copy when present", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: { experience: "intermediate" },
      weather: { source: "fallback", temperatureC: 20 },
    });
    expect(analysis.hikeBrief).toBeTruthy();
    analysis.hikeBrief = {
      ...analysis.hikeBrief!,
      polishedCopy: "润色后的决策帖正文",
      copySource: "llm",
    };
    const text = buildShareCaption(analysis, "测试山");
    expect(text).toContain("测试山");
    expect(text).toContain("润色后的决策帖正文");
    expect(text).toContain("#户外");
    expect(text).toContain("Outdoor Copilot");
  });

  it("falls back to template copyText", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      weather: { source: "fallback", temperatureC: 20 },
    });
    const text = buildShareCaption(analysis, "测试山");
    expect(text).toContain(analysis.hikeBrief!.copyText.slice(0, 20));
  });
});
