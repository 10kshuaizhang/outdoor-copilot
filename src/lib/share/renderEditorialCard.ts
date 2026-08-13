import {
  heroMeasureLabel,
  sanitizeEditorialForRender,
} from "./editorialHero";
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
  /** e.g. "/ 样" — painted as the measure word under the digit. */
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
const INSET_RIGHT = 96;
const CONTENT_RIGHT = SHARE_CARD_WIDTH - INSET_RIGHT;
const FOOTER_Y = 1188;
const SLOGAN = DEFAULT_EDITORIAL_TAGLINE;
/** Moss header — title sits below brand chrome, above cream panel. */
const MOSS_TITLE_Y = 228;
const MOSS_TITLE_GAP = 54;
const MOSS_TITLE_MAX_LINES = 2;
/** Hero number lives in a right-side chip — list keeps full left column. */
const HERO_BOX_W = 220;
const HERO_BOX_X = CONTENT_RIGHT - HERO_BOX_W;
const HERO_BOX_PAD_Y = 22;
const HERO_BOX_PAD_X = 16;

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
  ctx.strokeStyle = "rgba(42, 74, 51, 0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(INSET_X, y);
  ctx.lineTo(CONTENT_RIGHT, y);
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
    ctx.font = `500 26px ${serifSc}`;
    const lines = wrapText(ctx, footerNote, CONTENT_RIGHT - INSET_X, 2);
    lines.forEach((line, i) => {
      ctx.fillText(line, INSET_X, FOOTER_Y + 46 + i * 40);
    });
  }

  ctx.fillStyle = "#9a948c";
  ctx.font = `500 18px ${sans}`;
  ctx.fillText(tagline, INSET_X, FOOTER_Y + 158);
}

/**
 * Vertical hero chip: one big digit, one short caption under it.
 * Never paints number+unit on the same baseline (avoids「4句」叠「/ 句」).
 */
function drawHeroChip(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    w: number;
    number: string;
    unit: string;
    label: string;
    display: string;
    serifSc: string;
  },
): number {
  const { x, y, w, number, unit, label, display, serifSc } = opts;
  const measure = heroMeasureLabel(unit);
  // Prefer a short human label; otherwise the measure word alone.
  const caption = (label || measure).trim();
  const hasCaption = Boolean(caption);

  const numSize = hasCaption ? 92 : 100;
  const captionSize = caption.length > 3 ? 22 : 26;
  const gap = 10;
  const boxH =
    HERO_BOX_PAD_Y +
    numSize +
    (hasCaption ? gap + captionSize + 6 : 8) +
    HERO_BOX_PAD_Y;

  // Soft chip — no heavy border, just a moss wash.
  roundRect(ctx, x, y, w, boxH, 20);
  ctx.fillStyle = "rgba(42, 74, 51, 0.07)";
  ctx.fill();

  ctx.save();
  roundRect(ctx, x, y, w, boxH, 20);
  ctx.clip();

  const numBaseline = y + HERO_BOX_PAD_Y + numSize * 0.82;
  ctx.fillStyle = "#1c1a17";
  ctx.font = `700 ${numSize}px ${display}`;
  const numW = ctx.measureText(number).width;
  ctx.fillText(number, x + (w - numW) / 2, numBaseline);

  if (hasCaption) {
    ctx.fillStyle = "#3f6b4a";
    ctx.font = `700 ${captionSize}px ${serifSc}`;
    const maxCaptionW = w - HERO_BOX_PAD_X * 2;
    const lines = wrapText(ctx, caption, maxCaptionW, 1);
    const line = lines[0] ?? caption;
    const lw = ctx.measureText(line).width;
    ctx.fillText(
      line,
      x + (w - Math.min(lw, maxCaptionW)) / 2,
      numBaseline + gap + captionSize,
    );
  }

  ctx.restore();
  return boxH;
}

/**
 * Render a non-route Xiaohongshu cover in the same Moss & Dawn 3:4 format
 * as route share cards.
 */
export async function renderEditorialCardPng(
  input: EditorialCardInput,
): Promise<Blob> {
  await waitForShareFonts();

  const clean = sanitizeEditorialForRender(input);

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const { display, serifSc } = SHARE_FONTS;
  drawMossAtmosphere(ctx);
  drawBrandHeader(ctx);

  // Title on moss: slightly tighter tracking feel via size + gap.
  ctx.fillStyle = "#f7f3ea";
  ctx.font = `700 50px ${serifSc}`;
  const titles = titleLinesFrom(
    ctx,
    clean.title || "Outdoor Copilot",
    936,
    MOSS_TITLE_MAX_LINES,
  );
  titles.forEach((line, i) => {
    const lineY = MOSS_TITLE_Y + i * MOSS_TITLE_GAP;
    if (lineY + 8 < PANEL_Y) {
      ctx.fillText(line, 72, lineY);
    }
  });

  // Cream panel.
  roundRect(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 28);
  ctx.fillStyle = "#f4efe4";
  ctx.fill();

  let y = PANEL_Y + 56;
  if (clean.eyebrow?.trim()) {
    // Moss accent bar + eyebrow.
    roundRect(ctx, INSET_X, y - 22, 6, 28, 3);
    ctx.fillStyle = "#3f6b4a";
    ctx.fill();
    ctx.font = `600 26px ${serifSc}`;
    ctx.fillText(clean.eyebrow.trim(), INSET_X + 18, y);
    y += 52;
  }

  const items = (clean.items ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const heroNum = clean.heroNumber?.trim() ?? "";
  const hasHero = heroNum.length > 0;
  const contentStartY = y;

  const heroUnit = (clean.heroUnit ?? "").trim();
  const heroLabel = (clean.heroLabel ?? "").trim();

  let heroBoxH = 0;
  if (hasHero) {
    heroBoxH = drawHeroChip(ctx, {
      x: HERO_BOX_X,
      y: contentStartY - 8,
      w: HERO_BOX_W,
      number: heroNum,
      unit: heroUnit,
      label: heroLabel,
      display,
      serifSc,
    });
  } else if (heroLabel) {
    ctx.fillStyle = "#3f6b4a";
    ctx.font = `700 26px ${serifSc}`;
    ctx.fillText(heroLabel, INSET_X, y);
    y += 40;
  }

  const leadMaxW = hasHero ? HERO_BOX_X - INSET_X - 36 : CONTENT_RIGHT - INSET_X;
  let leadEndY = contentStartY;
  if (clean.lead?.trim()) {
    ctx.fillStyle = "#2a2722";
    ctx.font = `500 28px ${serifSc}`;
    const leadLines = wrapText(ctx, clean.lead.trim(), leadMaxW, 4);
    let leadY = contentStartY + 4;
    leadLines.forEach((line) => {
      ctx.fillText(line, INSET_X, leadY);
      leadY += 42;
    });
    leadEndY = leadY + 4;
  }

  if (hasHero) {
    y = Math.max(leadEndY, contentStartY - 8 + heroBoxH) + 36;
  } else {
    y = leadEndY > contentStartY ? leadEndY + 16 : y;
  }

  const listHeading = clean.sectionTitle?.trim();
  const sectionBody = clean.sectionBody?.trim();
  if (listHeading && items.length > 0 && !sectionBody) {
    ctx.fillStyle = "#3f6b4a";
    ctx.font = `700 24px ${serifSc}`;
    ctx.fillText(listHeading, INSET_X, y);
    y += 44;
  }

  const listTop = y;
  const listBudget = FOOTER_Y - listTop - (sectionBody ? 160 : 100);
  const rowH = Math.min(
    68,
    Math.max(54, Math.floor(listBudget / Math.max(1, items.length))),
  );

  items.forEach((label, i) => {
    const rowY = listTop + i * rowH;
    const badge = 40;
    roundRect(ctx, INSET_X, rowY - 28, badge, badge, 11);
    ctx.fillStyle = "rgba(42, 74, 51, 0.1)";
    ctx.fill();
    ctx.fillStyle = "#2a4a33";
    ctx.font = `700 24px ${display}`;
    const num = String(i + 1);
    const nw = ctx.measureText(num).width;
    ctx.fillText(num, INSET_X + (badge - nw) / 2, rowY);
    ctx.fillStyle = "#1c1a17";
    const itemSize = rowH < 58 ? 25 : 28;
    ctx.font = `600 ${itemSize}px ${serifSc}`;
    const itemLines = wrapText(
      ctx,
      label,
      CONTENT_RIGHT - INSET_X - badge - 24,
      1,
    );
    ctx.fillText(itemLines[0] ?? label, INSET_X + badge + 18, rowY);
  });
  if (items.length) y = listTop + items.length * rowH + 4;

  const hasSectionBody = Boolean(sectionBody);
  const hasSectionTitleOnly =
    Boolean(listHeading) && !hasSectionBody && items.length > 0;
  const sectionTop = Math.min(y + 16, FOOTER_Y - 140);
  if (hasSectionBody && sectionTop < FOOTER_Y - 80) {
    drawHairline(ctx, sectionTop);
    y = sectionTop + 42;

    if (listHeading && !hasSectionTitleOnly) {
      ctx.fillStyle = "#3f6b4a";
      ctx.font = `700 24px ${serifSc}`;
      ctx.fillText(listHeading, INSET_X, y);
      y += 38;
    }
    ctx.fillStyle = "#3a3530";
    ctx.font = `500 26px ${serifSc}`;
    const bodyLines = wrapText(ctx, sectionBody!, CONTENT_RIGHT - INSET_X, 2);
    bodyLines.forEach((line) => {
      if (y < FOOTER_Y - 48) {
        ctx.fillText(line, INSET_X, y);
        y += 38;
      }
    });
  } else if (listHeading && items.length === 0 && sectionTop < FOOTER_Y - 80) {
    drawHairline(ctx, sectionTop);
    y = sectionTop + 42;
    ctx.fillStyle = "#3f6b4a";
    ctx.font = `700 24px ${serifSc}`;
    ctx.fillText(listHeading, INSET_X, y);
  }

  const tagline = (clean.tagline ?? SLOGAN).trim() || SLOGAN;
  const footerNote = clean.footerNote?.trim() ?? "";
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
