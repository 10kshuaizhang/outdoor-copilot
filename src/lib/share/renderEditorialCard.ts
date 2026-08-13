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

/** Match route share-card chrome. */
const PANEL_X = 48;
const PANEL_Y = 308;
const PANEL_W = 984;
const PANEL_H = 1072;
const INSET_X = 96;
const FOOTER_Y = 1188;
const SLOGAN = DEFAULT_EDITORIAL_TAGLINE;
/** Moss header — title sits below brand chrome, above cream panel. */
const MOSS_TITLE_Y = 228;
const MOSS_TITLE_GAP = 54;
const MOSS_TITLE_MAX_LINES = 2;
/** Hero number lives in a right-side chip — list keeps full left column. */
const HERO_BOX_X = 720;
const HERO_BOX_W = 252;
const HERO_BOX_PAD = 16;

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

function drawHairline(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = "rgba(42, 74, 51, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(INSET_X, y);
  ctx.lineTo(984, y);
  ctx.stroke();
}

function drawEditorialFooter(
  ctx: CanvasRenderingContext2D,
  footerNote: string,
  tagline: string,
) {
  const { serifSc, sans } = SHARE_FONTS;
  drawHairline(ctx, FOOTER_Y);

  if (footerNote) {
    ctx.fillStyle = "#1c1a17";
    ctx.font = `500 24px ${serifSc}`;
    const lines = wrapText(ctx, footerNote, 880, 2);
    lines.forEach((line, i) => {
      ctx.fillText(line, INSET_X, FOOTER_Y + 48 + i * 38);
    });
  }

  ctx.fillStyle = "#8a847c";
  ctx.font = `500 20px ${sans}`;
  ctx.fillText(tagline, INSET_X, FOOTER_Y + 160);
}

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
  ctx.font = `700 52px ${serifSc}`;
  const titles = titleLinesFrom(
    ctx,
    input.title || "Outdoor Copilot",
    936,
    MOSS_TITLE_MAX_LINES,
  );
  titles.forEach((line, i) => {
    const lineY = MOSS_TITLE_Y + i * MOSS_TITLE_GAP;
    if (lineY + 8 < PANEL_Y) {
      ctx.fillText(line, 72, lineY);
    }
  });

  roundRect(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 28);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();

  let y = PANEL_Y + 58;
  if (input.eyebrow?.trim()) {
    ctx.fillStyle = "#3f6b4a";
    ctx.font = `600 28px ${serifSc}`;
    ctx.fillText(input.eyebrow.trim(), INSET_X, y);
    y += 48;
  }

  const items = (input.items ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const heroNum = input.heroNumber?.trim() ?? "";
  const hasHero = heroNum.length > 0;
  const contentStartY = y;

  const heroUnit = (input.heroUnit ?? "").trim();
  const heroLabel = (input.heroLabel ?? "").trim();

  let heroBoxH = 0;
  if (hasHero) {
    // Compact chip: big number + unit on one row; optional short label under.
    const heroSize = items.length >= 5 ? 72 : items.length >= 4 ? 80 : 88;
    const hasLabel = Boolean(heroLabel);
    heroBoxH = HERO_BOX_PAD + heroSize + (hasLabel ? 44 : 20) + HERO_BOX_PAD;

    roundRect(ctx, HERO_BOX_X, contentStartY, HERO_BOX_W, heroBoxH, 16);
    ctx.fillStyle = "rgba(42, 74, 51, 0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(42, 74, 51, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    roundRect(ctx, HERO_BOX_X, contentStartY, HERO_BOX_W, heroBoxH, 16);
    ctx.clip();

    const numBaseline = contentStartY + HERO_BOX_PAD + heroSize - 6;
    ctx.fillStyle = "#1c1a17";
    ctx.font = `700 ${heroSize}px ${display}`;
    const numW = ctx.measureText(heroNum).width;

    if (heroUnit) {
      ctx.font = `600 24px ${sans}`;
      const unitW = ctx.measureText(heroUnit).width;
      const rowW = numW + 10 + unitW;
      const rowLeft = HERO_BOX_X + (HERO_BOX_W - rowW) / 2;
      ctx.font = `700 ${heroSize}px ${display}`;
      ctx.fillStyle = "#1c1a17";
      ctx.fillText(heroNum, rowLeft, numBaseline);
      ctx.fillStyle = "#6b6560";
      ctx.font = `600 24px ${sans}`;
      ctx.fillText(heroUnit, rowLeft + numW + 10, numBaseline - heroSize * 0.38);
    } else {
      ctx.fillText(heroNum, HERO_BOX_X + (HERO_BOX_W - numW) / 2, numBaseline);
    }

    if (heroLabel) {
      ctx.fillStyle = "#2a4a33";
      ctx.font = `700 24px ${serifSc}`;
      const labelLines = wrapText(ctx, heroLabel, HERO_BOX_W - 28, 1);
      const line = labelLines[0] ?? heroLabel;
      const lw = ctx.measureText(line).width;
      ctx.fillText(
        line,
        HERO_BOX_X + (HERO_BOX_W - lw) / 2,
        numBaseline + 36,
      );
    }
    ctx.restore();
  } else if (heroLabel) {
    ctx.fillStyle = "#3f6b4a";
    ctx.font = `700 26px ${serifSc}`;
    ctx.fillText(heroLabel, INSET_X, y);
    y += 40;
  }

  const leadMaxW = hasHero ? HERO_BOX_X - INSET_X - 28 : 880;
  let leadEndY = contentStartY;
  if (input.lead?.trim()) {
    ctx.fillStyle = "#1c1a17";
    ctx.font = `500 28px ${serifSc}`;
    const leadLines = wrapText(ctx, input.lead.trim(), leadMaxW, 3);
    let leadY = contentStartY;
    leadLines.forEach((line) => {
      ctx.fillText(line, INSET_X, leadY);
      leadY += 40;
    });
    leadEndY = leadY + 8;
  }

  if (hasHero) {
    y = Math.max(leadEndY, contentStartY + heroBoxH) + 28;
  } else {
    y = leadEndY > contentStartY ? leadEndY + 8 : y;
  }

  // Optional list heading (sectionTitle when no separate section body block yet).
  const listHeading = input.sectionTitle?.trim();
  const sectionBody = input.sectionBody?.trim();
  if (listHeading && items.length > 0 && !sectionBody) {
    ctx.fillStyle = "#3f6b4a";
    ctx.font = `700 26px ${serifSc}`;
    ctx.fillText(listHeading, INSET_X, y);
    y += 40;
  }

  const listTop = y;
  const listBudget = FOOTER_Y - listTop - 120;
  const rowH = Math.min(
    64,
    Math.max(52, Math.floor(listBudget / Math.max(1, items.length))),
  );

  items.forEach((label, i) => {
    const rowY = listTop + i * rowH;
    roundRect(ctx, INSET_X, rowY - 30, 44, 44, 12);
    ctx.fillStyle = "rgba(42, 74, 51, 0.1)";
    ctx.fill();
    ctx.fillStyle = "#2a4a33";
    ctx.font = `700 26px ${display}`;
    const num = String(i + 1);
    const nw = ctx.measureText(num).width;
    ctx.fillText(num, INSET_X + (44 - nw) / 2, rowY);
    ctx.fillStyle = "#1c1a17";
    ctx.font = `600 ${rowH < 58 ? 24 : 28}px ${serifSc}`;
    const itemLines = wrapText(ctx, label, 792, 1);
    ctx.fillText(itemLines[0] ?? label, INSET_X + 60, rowY);
  });
  if (items.length) y = listTop + items.length * rowH + 8;

  const hasSectionBody = Boolean(sectionBody);
  const hasSectionTitleOnly =
    Boolean(listHeading) && !hasSectionBody && items.length > 0;
  // Title already drawn as list heading — only draw bottom section when body exists.
  const sectionTop = Math.min(y + 12, FOOTER_Y - 140);
  if (hasSectionBody && sectionTop < FOOTER_Y - 80) {
    drawHairline(ctx, sectionTop);
    y = sectionTop + 40;

    if (listHeading && !hasSectionTitleOnly) {
      ctx.fillStyle = "#3f6b4a";
      ctx.font = `700 26px ${serifSc}`;
      ctx.fillText(listHeading, INSET_X, y);
      y += 40;
    }
    ctx.fillStyle = "#1c1a17";
    ctx.font = `500 26px ${serifSc}`;
    const bodyLines = wrapText(ctx, sectionBody!, 880, 2);
    bodyLines.forEach((line) => {
      if (y < FOOTER_Y - 48) {
        ctx.fillText(line, INSET_X, y);
        y += 36;
      }
    });
  } else if (listHeading && items.length === 0 && sectionTop < FOOTER_Y - 80) {
    drawHairline(ctx, sectionTop);
    y = sectionTop + 40;
    ctx.fillStyle = "#3f6b4a";
    ctx.font = `700 26px ${serifSc}`;
    ctx.fillText(listHeading, INSET_X, y);
  }

  const tagline = (input.tagline ?? SLOGAN).trim() || SLOGAN;
  const footerNote = input.footerNote?.trim() ?? "";
  drawEditorialFooter(ctx, footerNote, tagline);

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
