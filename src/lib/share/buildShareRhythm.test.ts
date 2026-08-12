import { describe, expect, it } from "vitest";
import { analyzeRoute } from "@/lib/engine";
import { SHORT_CLIMB_POINTS } from "@/lib/engine/fixtures/shortClimb.points";
import {
  DEFAULT_SHARE_CARD_STYLE,
  SHARE_CARD_STYLE_OPTIONS,
  buildShareRhythm,
  formatShareDuration,
  shareRiskLine,
} from "./buildShareRhythm";
import { findHardestStretch, ensureSegmentEffort } from "@/lib/engine/effort";

describe("share card style defaults", () => {
  it("defaults to airy (美感)", () => {
    expect(DEFAULT_SHARE_CARD_STYLE).toBe("airy");
    expect(SHARE_CARD_STYLE_OPTIONS.map((o) => o.id)).toEqual([
      "airy",
      "balanced",
      "rich",
    ]);
  });
});

describe("formatShareDuration", () => {
  it("formats hour ranges compactly", () => {
    expect(formatShareDuration(300, 390)).toBe("5–6.5 h");
    expect(formatShareDuration(40, 55)).toBe("40–55 分钟");
  });
});

describe("buildShareRhythm", () => {
  it("returns up to 3 phases for balanced and 4 for rich", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      weather: { source: "fallback", temperatureC: 18 },
    });
    const balanced = buildShareRhythm(analysis, "balanced");
    const rich = buildShareRhythm(analysis, "rich");
    expect(balanced.length).toBeGreaterThan(0);
    expect(balanced.length).toBeLessThanOrEqual(3);
    expect(rich.length).toBeGreaterThan(0);
    expect(rich.length).toBeLessThanOrEqual(4);
    expect(balanced.some((p) => p.peak) || rich.some((p) => p.peak)).toBe(true);
  });

  it("shareRiskLine mentions hardest stretch when present", () => {
    const analysis = analyzeRoute({
      points: SHORT_CLIMB_POINTS,
      weather: { source: "fallback", temperatureC: 18 },
    });
    const hardest = findHardestStretch(ensureSegmentEffort(analysis.segments));
    const line = shareRiskLine(analysis, hardest);
    expect(line.startsWith("主风险：")).toBe(true);
  });
});
