import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExplanationBody } from "./ExplanationBody";

describe("ExplanationBody", () => {
  it("renders bold markdown as strong", () => {
    const html = renderToStaticMarkup(
      createElement(ExplanationBody, {
        text: "整体难度 **64分**，属于吃力。",
      }),
    );
    expect(html).toContain("<strong");
    expect(html).toContain("64分");
    expect(html).not.toContain("**");
  });

  it("renders bullet lists", () => {
    const html = renderToStaticMarkup(
      createElement(ExplanationBody, {
        text: "- 距离 8.8 km\n- 爬升 740 m",
      }),
    );
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain("8.8 km");
  });
});
