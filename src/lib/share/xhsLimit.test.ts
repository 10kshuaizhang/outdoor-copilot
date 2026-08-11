import { describe, expect, it } from "vitest";
import {
  XHS_CAPTION_MAX,
  assembleXhsBriefCopy,
  assembleXhsCaption,
  clampXhsText,
  xhsBodyBudget,
  xhsCharCount,
} from "./xhsLimit";

describe("xhsLimit", () => {
  it("counts unicode code points", () => {
    expect(xhsCharCount("不建议")).toBe(3);
    expect(xhsCharCount("ab\n")).toBe(3);
  });

  it("clamps to max without exceeding", () => {
    const long = "山".repeat(1200);
    const out = clampXhsText(long, 1000);
    expect(xhsCharCount(out)).toBeLessThanOrEqual(1000);
  });

  it("assembleXhsCaption never exceeds 1000", () => {
    const body = ["降雨偏多，午后对流。", "新手不宜。", "带雨衣。"]
      .join("\n")
      .repeat(80);
    const caption = assembleXhsCaption({
      title: "阳台山—妙峰山环线",
      verdictLabel: "不建议硬闯",
      body,
    });
    expect(xhsCharCount(caption)).toBeLessThanOrEqual(XHS_CAPTION_MAX);
    expect(caption).toContain("#OutdoorCopilot");
  });

  it("assembleXhsBriefCopy never exceeds 1000", () => {
    const copy = assembleXhsBriefCopy("山".repeat(1500));
    expect(xhsCharCount(copy)).toBeLessThanOrEqual(XHS_CAPTION_MAX);
  });

  it("body budget leaves room for footer", () => {
    const budget = xhsBodyBudget({
      title: "测试山",
      verdictLabel: "谨慎考虑",
    });
    expect(budget).toBeLessThan(XHS_CAPTION_MAX);
    expect(budget).toBeGreaterThan(500);
  });
});
