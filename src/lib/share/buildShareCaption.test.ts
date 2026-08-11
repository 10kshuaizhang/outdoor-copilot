import { describe, expect, it } from "vitest";
import { analyzeRoute } from "@/lib/engine";
import { SHORT_CLIMB_POINTS } from "@/lib/engine/fixtures/shortClimb.points";
import { buildShareCaption } from "./buildShareCaption";
import { XHS_CAPTION_MAX, xhsCharCount } from "./xhsLimit";

describe("buildShareCaption", () => {
  it("prefers polished hike brief copy when present and stays ≤1000", () => {
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
    expect(xhsCharCount(text)).toBeLessThanOrEqual(XHS_CAPTION_MAX);
  });

  it("falls back to template copyText within 1000 chars", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      weather: { source: "fallback", temperatureC: 20 },
    });
    const text = buildShareCaption(analysis, "测试山");
    expect(text).toContain(analysis.hikeBrief!.copyText.slice(0, 20));
    expect(xhsCharCount(text)).toBeLessThanOrEqual(XHS_CAPTION_MAX);
  });

  it("clamps oversized polished bodies", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      weather: { source: "fallback", temperatureC: 20 },
    });
    analysis.hikeBrief = {
      ...analysis.hikeBrief!,
      polishedCopy: "雨".repeat(2000),
      copySource: "llm",
    };
    const text = buildShareCaption(analysis, "超长线");
    expect(xhsCharCount(text)).toBeLessThanOrEqual(XHS_CAPTION_MAX);
  });
});
