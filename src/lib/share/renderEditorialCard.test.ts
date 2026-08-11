import { describe, expect, it } from "vitest";
import {
  EDITORIAL_PRESETS,
  editorialFilename,
} from "./renderEditorialCard";
import { wrapText } from "./shareCardCanvas";

describe("editorial xhs presets", () => {
  it("ships the rainy-day gear preset with four items", () => {
    const rain = EDITORIAL_PRESETS.find((p) => p.id === "rain-gear-4");
    expect(rain).toBeTruthy();
    expect(rain!.input.items).toHaveLength(4);
    expect(rain!.input.heroNumber).toBe("4");
  });

  it("builds a safe download filename from the title", () => {
    expect(editorialFilename("降雨倾向日\n第二行")).toMatch(
      /^outdoor-copilot-降雨倾向日\.png$/,
    );
  });
});

describe("shareCardCanvas wrapText", () => {
  it("wraps by measured width", () => {
    const ctx = {
      measureText: (s: string) => ({ width: s.length * 10 }),
    } as CanvasRenderingContext2D;
    expect(wrapText(ctx, "abcdefghij", 50, 3)).toEqual(["abcde", "fghij"]);
  });
});
