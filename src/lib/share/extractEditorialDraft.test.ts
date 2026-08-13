import { describe, expect, it } from "vitest";
import {
  fallbackEditorialDraft,
  normalizeEditorialDraft,
  normalizeHeroUnit,
} from "./extractEditorialDraft";
import { DEFAULT_EDITORIAL_TAGLINE } from "./renderEditorialCard";

describe("normalizeHeroUnit", () => {
  it("prefixes bare Chinese measure words", () => {
    expect(normalizeHeroUnit("句")).toBe("/ 句");
    expect(normalizeHeroUnit("/ 样")).toBe("/ 样");
    expect(normalizeHeroUnit("")).toBe("");
  });
});

describe("normalizeEditorialDraft", () => {
  it("accepts valid LLM-shaped JSON", () => {
    const draft = normalizeEditorialDraft({
      title: "降雨倾向日\n不必买专业装备",
      eyebrow: "周末日走 · 雨天加装",
      lead: "只多带 4 样，加的是失败成本。",
      heroNumber: "4",
      heroUnit: "/ 样",
      heroLabel: "雨天加装",
      items: ["包罩", "薄壳", "头灯", "备用袜"],
      sectionTitle: "先别临时加",
      sectionBody: "重型冲锋 · 不合脚新鞋",
      footerNote: "工具的意义是减少错误决策。",
      tagline: DEFAULT_EDITORIAL_TAGLINE,
    });
    expect(draft).toBeTruthy();
    expect(draft!.title).toBe("降雨倾向日\n不必买专业装备");
    expect(draft!.items).toHaveLength(4);
  });

  it("fixes bare unit and moves long heroLabel into sectionTitle", () => {
    const draft = normalizeEditorialDraft({
      title: "东灵山夜爬\n本周别冲动",
      eyebrow: "夜爬 · 选日指南",
      lead: "周末雨意未散。",
      heroNumber: "4",
      heroUnit: "句",
      heroLabel: "夜爬铁律",
      items: ["天气不对可以怂", "时间按慢估", "灯热吃定位", "不对劲就撤"],
      sectionTitle: "",
      sectionBody: "",
      footerNote: "赢在选日子。",
      tagline: DEFAULT_EDITORIAL_TAGLINE,
    });
    expect(draft).toBeTruthy();
    expect(draft!.heroUnit).toBe("/ 句");
    expect(draft!.heroLabel).toBe("");
    expect(draft!.sectionTitle).toBe("夜爬铁律");
  });

  it("keeps short non-heading labels like 雨天加装 on the hero chip", () => {
    const draft = normalizeEditorialDraft({
      title: "降雨日\n多带4样",
      eyebrow: "周末",
      lead: "只多带四样。",
      heroNumber: "4",
      heroUnit: "/ 样",
      heroLabel: "雨天加装",
      items: ["包罩", "薄壳", "头灯", "备用袜"],
      sectionTitle: "",
      sectionBody: "",
      footerNote: "少买。",
      tagline: DEFAULT_EDITORIAL_TAGLINE,
    });
    expect(draft!.heroLabel).toBe("雨天加装");
    expect(draft!.sectionTitle).toBeUndefined();
  });

  it("rejects empty title or short items", () => {
    expect(normalizeEditorialDraft({ title: "", items: ["a", "b"] })).toBeNull();
    expect(
      normalizeEditorialDraft({ title: "有标题", items: ["仅一条"] }),
    ).toBeNull();
  });
});

describe("fallbackEditorialDraft", () => {
  it("pulls bullets and a hero number from plain text", () => {
    const draft = fallbackEditorialDraft(
      [
        "降雨倾向日不必买装备",
        "在最小装备上多带 4 样",
        "1. 包罩",
        "2. 薄壳",
        "3. 头灯",
        "工具的意义是减少错误决策。",
      ].join("\n"),
    );
    expect(draft.items!.length).toBeGreaterThanOrEqual(2);
    expect(draft.heroNumber).toBe("4");
    expect(draft.tagline).toBe(DEFAULT_EDITORIAL_TAGLINE);
  });
});
