import { describe, expect, it } from "vitest";
import { analyzeRoute } from "@/lib/engine";
import { SHORT_CLIMB_POINTS } from "@/lib/engine/fixtures/shortClimb.points";
import { buildShareCaption } from "./buildShareCaption";

describe("buildShareCaption", () => {
  it("includes score, stats, and Xiaohongshu hashtags", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      profile: { experience: "intermediate" },
      weather: { source: "fallback", temperatureC: 20 },
    });
    const text = buildShareCaption(analysis, "测试山");
    expect(text).toContain("测试山");
    expect(text).toContain("/100");
    expect(text).toContain("#户外");
    expect(text).toContain("Outdoor Copilot");
  });
});
