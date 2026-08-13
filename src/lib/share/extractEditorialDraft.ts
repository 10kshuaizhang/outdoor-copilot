import {
  DEFAULT_EDITORIAL_TAGLINE,
  type EditorialCardInput,
} from "./renderEditorialCard";

export type EditorialExtractResult =
  | {
      ok: true;
      source: "llm" | "fallback";
      draft: EditorialCardInput;
      model?: string;
    }
  | { ok: false; message: string };

const EXTRACT_SYSTEM = `你是 Outdoor Copilot 的小红书封面字段提取器。用户会粘贴一篇中文户外/徒步相关文稿，你需要输出一张 1080×1440  editorial 封面所需的结构化字段。

硬规则：
1. 只输出一个 JSON 对象，不要 Markdown、不要解释、不要代码块。
2. 只能使用文稿里已有或可合理概括的信息，禁止发明具体数字、地点、装备型号。
3. 字段必须适合海报排版：短句、清单化、少废话。
4. items 必须 3–6 条，每条 ≤ 22 字，是可独立阅读的要点。
5. title 用 \\n 分成最多 2 行，每行 ≤ 16 字，有海报标题感。
6. eyebrow 格式类似「栏目 · 主题」，≤ 18 字。
7. lead 1–2 句，≤ 72 字。
8. heroNumber 取文中最醒目的单个数字（如「4」「3」）；没有则空字符串。不要把清单序号当 heroNumber。
9. heroUnit 必须带斜杠，如「/ 样」「/ 条」「/ 句」「/ 项」；禁止单独输出「句」「样」等单字。
10. heroLabel 极短旁注（≤6 字），如「铁律」「雨天加装」。若文中有清单小标题（如「夜爬铁律」），放到 sectionTitle，不要放进 heroLabel。
11. sectionTitle / sectionBody：清单小标题用 sectionTitle；避坑补充用 sectionBody。没有则空字符串。
12. footerNote 一句中文金句，≤ 48 字，像分享图底部「主风险」位置的收束句。
13. tagline 固定为：${DEFAULT_EDITORIAL_TAGLINE}

JSON 键（全部必填字符串或数组）：
title, eyebrow, lead, heroNumber, heroUnit, heroLabel, items, sectionTitle, sectionBody, footerNote, tagline`;

export function normalizeEditorialDraft(raw: unknown): EditorialCardInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const str = (v: unknown, max: number) => {
    if (typeof v !== "string") return "";
    return v.trim().slice(0, max);
  };

  const titleRaw = str(o.title, 120);
  if (!titleRaw) return null;

  const titleLines = titleRaw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  const title = titleLines.join("\n");

  const items = Array.isArray(o.items)
    ? o.items
        .map((x) => (typeof x === "string" ? x.trim().slice(0, 28) : ""))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  if (items.length < 2) return null;

  let heroNumber = str(o.heroNumber, 8).replace(/[^\d]/g, "").slice(0, 3);
  let heroUnit = normalizeHeroUnit(str(o.heroUnit, 12));
  let heroLabel = str(o.heroLabel, 12);
  let sectionTitle = str(o.sectionTitle, 24);
  const sectionBody = str(o.sectionBody, 120);

  // Long / heading-like labels belong above the list, not under the digit.
  const headingLike =
    /铁律|清单|提醒|法则|守则|步骤|指南|注意|要点$/.test(heroLabel);
  if ((heroLabel.length > 5 || headingLike) && !sectionTitle) {
    sectionTitle = heroLabel.slice(0, 24);
    heroLabel = "";
  } else if (heroLabel.length > 5) {
    heroLabel = heroLabel.slice(0, 5);
  }
  if (heroLabel && sectionTitle && heroLabel === sectionTitle) {
    heroLabel = "";
  }

  // Bare measure words like「句」become「/ 句」; drop junk units.
  if (!heroUnit && heroNumber) {
    heroUnit = "/ 项";
  }

  return {
    title,
    eyebrow: str(o.eyebrow, 24) || undefined,
    lead: str(o.lead, 80) || undefined,
    heroNumber,
    heroUnit,
    heroLabel,
    items,
    sectionTitle: sectionTitle || undefined,
    sectionBody: sectionBody || undefined,
    footerNote: str(o.footerNote, 56) || undefined,
    tagline: str(o.tagline, 80) || DEFAULT_EDITORIAL_TAGLINE,
  };
}

/** Ensure units render as "/ 句" not a floating bare「句」。 */
export function normalizeHeroUnit(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^\/\s*\S+$/.test(t)) return t.replace(/^\/\s*/, "/ ").slice(0, 8);
  // Single Chinese measure / short word
  if (/^[\u4e00-\u9fff]{1,3}$/.test(t)) return `/ ${t}`;
  if (/^[a-zA-Z]{1,6}$/.test(t)) return `/ ${t}`;
  return t.slice(0, 8);
}

/** Rule-based fallback when LLM is unavailable. */
export function fallbackEditorialDraft(article: string): EditorialCardInput {
  const lines = article
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const title =
    lines.slice(0, 2).join("\n") || "Outdoor Copilot";

  const bulletRe = /^[\d①②③④⑤⑥⑦⑧⑨⑩]+[.、)\]】\s]+|^[-*•·]\s*/;
  const items = lines
    .filter((l) => bulletRe.test(l) && l.length <= 40)
    .map((l) => l.replace(bulletRe, "").trim())
    .filter(Boolean)
    .slice(0, 6);

  const fallbackItems =
    items.length >= 2
      ? items
      : lines
          .filter((l) => l.length >= 4 && l.length <= 28 && l !== title)
          .slice(0, 4);

  const numMatch = article.match(/(\d+)\s*[样条个项句点]/);
  const heroNumber = numMatch?.[1] ?? "";
  const unitChar = numMatch?.[0]?.replace(/^\d+\s*/, "") ?? "项";

  return {
    title,
    eyebrow: "户外决策 · 封面",
    lead: lines.find((l) => l.length > 12 && l.length <= 72) ?? lines[2] ?? "",
    heroNumber,
    heroUnit: heroNumber ? `/ ${unitChar || "项"}` : "",
    heroLabel: heroNumber ? "要点" : "",
    items: fallbackItems.length >= 2 ? fallbackItems : ["要点一", "要点二", "要点三"],
    sectionTitle: "",
    sectionBody: "",
    footerNote:
      lines.find((l) => l.includes("工具") || l.includes("决策"))?.slice(0, 48) ??
      "先看清再出发，少做错误决策。",
    tagline: DEFAULT_EDITORIAL_TAGLINE,
  };
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(body) as unknown;
}

export async function extractEditorialDraftFromArticle(
  article: string,
  opts?: { presetHint?: string },
): Promise<EditorialExtractResult> {
  const trimmed = article.trim();
  if (trimmed.length < 20) {
    return { ok: false, message: "文稿太短，请至少粘贴一小段正文。" };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return {
      ok: true,
      source: "fallback",
      draft: fallbackEditorialDraft(trimmed),
    };
  }

  const userParts = [
    opts?.presetHint ? `预设参考：${opts.presetHint}` : "",
    "文稿如下：",
    trimmed.slice(0, 12000),
  ].filter(Boolean);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EXTRACT_SYSTEM },
          { role: "user", content: userParts.join("\n\n") },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`llm ${res.status}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("empty");

    const parsed = parseJsonObject(content);
    const draft = normalizeEditorialDraft(parsed);
    if (!draft) throw new Error("invalid shape");

    return { ok: true, source: "llm", draft, model };
  } catch {
    return {
      ok: true,
      source: "fallback",
      draft: fallbackEditorialDraft(trimmed),
    };
  }
}
