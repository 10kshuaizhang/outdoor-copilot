import { describe, expect, it } from "vitest";
import { stripMultimodelFromShareText } from "./stripMultimodel";

describe("stripMultimodelFromShareText", () => {
  it("removes 多模型 weather block", () => {
    const input = [
      "东灵山户外简报｜宜上山",
      "系统性降水不明显。",
      "",
      "多模型",
      "多模型较一致（EC/GFS）。",
      "",
      "降雨",
      "系统性降水不明显。",
    ].join("\n");
    const out = stripMultimodelFromShareText(input);
    expect(out).not.toContain("多模型");
    expect(out).toContain("降雨");
    expect(out).toContain("宜上山");
  });

  it("removes leading model-agreement sentence but keeps the rest", () => {
    const out = stripMultimodelFromShareText(
      "多模型分歧偏大（差 8mm）；以更湿的一侧保守决策。今天阵雨扰动。\n降雨\n有雨。",
    );
    expect(out).not.toMatch(/多模型/);
    expect(out).toContain("今天阵雨扰动");
    expect(out).toContain("降雨");
  });
});
