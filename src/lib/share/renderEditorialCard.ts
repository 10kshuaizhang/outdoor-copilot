import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  SHARE_FONTS,
  drawBrandHeader,
  drawMossAtmosphere,
  roundRect,
  titleLinesFrom,
  waitForShareFonts,
  wrapText,
} from "./shareCardCanvas";

export type EditorialCardInput = {
  /** Main headline; use \\n for line breaks. */
  title: string;
  /** Green eyebrow inside the cream panel. */
  eyebrow?: string;
  /** Short supporting paragraph. */
  lead?: string;
  /** Large display number (e.g. "4"). Empty = hide hero number block. */
  heroNumber?: string;
  /** e.g. "/ 样" */
  heroUnit?: string;
  /** Label beside the number, e.g. "雨天加装" */
  heroLabel?: string;
  /** Numbered checklist (max 6). */
  items?: string[];
  /** Section under a hairline, e.g. "先别临时加" */
  sectionTitle?: string;
  sectionBody?: string;
  /** Bottom Chinese line. */
  footerNote?: string;
  /** English tagline. */
  tagline?: string;
};

export const DEFAULT_EDITORIAL_TAGLINE =
  "Know the trail. Know yourself. Go smarter.";

export const EDITORIAL_PRESETS: Array<{
  id: string;
  name: string;
  input: EditorialCardInput;
}> = [
  {
    id: "rain-gear-4",
    name: "降雨日 · 多带 4 样",
    input: {
      title: "降雨倾向日\n不必临时购入「专业装备」",
      eyebrow: "周末日走 · 雨天加装",
      lead: "在最小装备集之上，只多带 4 样。加的是失败成本，不是氛围消费。",
      heroNumber: "4",
      heroUnit: "/ 样",
      heroLabel: "雨天加装",
      items: [
        "包罩 / 防水包内分区",
        "轻量薄壳（防风防小雨）",
        "头灯 / 备用照明",
        "备用袜",
      ],
      sectionTitle: "先别临时加",
      sectionBody: "整套重型冲锋 · 一堆用不上的配件 · 不合脚的新鞋",
      footerNote: "工具的意义是减少错误决策，不是让你买更多。",
      tagline: DEFAULT_EDITORIAL_TAGLINE,
    },
  },
  {
    id: "blank",
    name: "空白模板",
    input: {
      title: "标题第一行\n标题第二行",
      eyebrow: "栏目 · 主题",
      lead: "一句话说明这篇在讲什么。",
      heroNumber: "",
      heroUnit: "",
      heroLabel: "",
      items: ["要点一", "要点二", "要点三"],
      sectionTitle: "补充",
      sectionBody: "",
      footerNote: "工具的意义是减少错误决策，不是让你买更多。",
      tagline: DEFAULT_EDITORIAL_TAGLINE,
    },
  },
];

/**
 * Render a non-route Xiaohongshu cover in the same Moss & Dawn 3:4 format
 * as route share cards.
 */
export async function renderEditorialCardPng(
  input: EditorialCardInput,
): Promise<Blob> {
  await waitForShareFonts();

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const { display, serifSc, sans } = SHARE_FONTS;
  drawMossAtmosphere(ctx);
  drawBrandHeader(ctx);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 56px ${serifSc}`;
  const titles = titleLinesFrom(ctx, input.title || "Outdoor Copilot", 936, 3);
  titles.forEach((line, i) => {
    ctx.fillText(line, 72, 240 + i * 70);
  });

  const panelY = 420;
  roundRect(ctx, 48, panelY, 984, 940, 28);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();

  let y = panelY + 64;
  if (input.eyebrow?.trim()) {
    ctx.fillStyle = "#3f6b4a";
    ctx.font = `600 30px ${serifSc}`;
    ctx.fillText(input.eyebrow.trim(), 96, y);
    y += 56;
  }

  if (input.lead?.trim()) {
    ctx.fillStyle = "#1c1a17";
    ctx.font = `500 30px ${serifSc}`;
    const leadLines = wrapText(ctx, input.lead.trim(), 880, 3);
    leadLines.forEach((line) => {
      ctx.fillText(line, 96, y);
      y += 44;
    });
    y += 20;
  }

  const heroNum = input.heroNumber?.trim();
  if (heroNum) {
    const scoreBaseline = y + 120;
    ctx.fillStyle = "#1c1a17";
    ctx.font = `700 140px ${display}`;
    ctx.fillText(heroNum, 96, scoreBaseline);
    const metaX = 96 + Math.max(160, ctx.measureText(heroNum).width + 28);

    if (input.heroUnit?.trim()) {
      ctx.fillStyle = "#6b6560";
      ctx.font = `600 34px ${sans}`;
      ctx.fillText(input.heroUnit.trim(), metaX, scoreBaseline - 78);
    }
    if (input.heroLabel?.trim()) {
      ctx.fillStyle = "#2a4a33";
      ctx.font = `700 48px ${serifSc}`;
      ctx.fillText(input.heroLabel.trim(), metaX, scoreBaseline - 8);
    }
    y = scoreBaseline + 50;
  }

  const items = (input.items ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  items.forEach((label, i) => {
    const rowY = y + i * 68;
    roundRect(ctx, 96, rowY - 34, 48, 48, 12);
    ctx.fillStyle = "rgba(42, 74, 51, 0.1)";
    ctx.fill();
    ctx.fillStyle = "#2a4a33";
    ctx.font = `700 28px ${display}`;
    const num = String(i + 1);
    const nw = ctx.measureText(num).width;
    ctx.fillText(num, 96 + (48 - nw) / 2, rowY);
    ctx.fillStyle = "#1c1a17";
    ctx.font = `600 30px ${serifSc}`;
    const itemLines = wrapText(ctx, label, 780, 1);
    ctx.fillText(itemLines[0] ?? label, 164, rowY);
  });
  if (items.length) y += items.length * 68 + 12;

  const hasSection =
    Boolean(input.sectionTitle?.trim()) || Boolean(input.sectionBody?.trim());
  if (hasSection) {
    ctx.strokeStyle = "rgba(42, 74, 51, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(96, y);
    ctx.lineTo(984, y);
    ctx.stroke();
    y += 48;

    if (input.sectionTitle?.trim()) {
      ctx.fillStyle = "#3f6b4a";
      ctx.font = `700 28px ${serifSc}`;
      ctx.fillText(input.sectionTitle.trim(), 96, y);
      y += 44;
    }
    if (input.sectionBody?.trim()) {
      ctx.fillStyle = "#1c1a17";
      ctx.font = `500 28px ${serifSc}`;
      const bodyLines = wrapText(ctx, input.sectionBody.trim(), 880, 3);
      bodyLines.forEach((line) => {
        ctx.fillText(line, 96, y);
        y += 40;
      });
    }
  }

  const tagline = (input.tagline ?? DEFAULT_EDITORIAL_TAGLINE).trim();
  const footerNote = input.footerNote?.trim() ?? "";
  const footerY = panelY + 880;
  ctx.fillStyle = "#6b6560";
  ctx.font = `500 24px ${sans}`;
  ctx.fillText(tagline, 96, footerY);
  if (footerNote) {
    ctx.fillStyle = "#2a4a33";
    ctx.font = `600 26px ${serifSc}`;
    const noteLines = wrapText(ctx, footerNote, 880, 2);
    noteLines.forEach((line, i) => {
      ctx.fillText(line, 96, footerY + 40 + i * 36);
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("PNG encode failed"));
        else resolve(blob);
      },
      "image/png",
      0.95,
    );
  });
}

export function editorialFilename(title: string): string {
  const safe =
    title
      .split(/\n/)[0]
      ?.replace(/[^\w\u4e00-\u9fff-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "editorial";
  return `outdoor-copilot-${safe}.png`;
}
