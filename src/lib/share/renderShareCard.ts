import { scoreBand, type RouteAnalysis } from "@/lib/engine";
import { ensureSegmentEffort, findHardestStretch } from "@/lib/engine/effort";
import {
  DEFAULT_SHARE_CARD_STYLE,
  buildShareRhythm,
  formatShareDuration,
  shareRiskLine,
  type RhythmPhase,
  type ShareCardStyle,
} from "./buildShareRhythm";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  SHARE_FONTS,
  drawBrandHeader,
  drawMossAtmosphere,
  roundRect,
  waitForShareFonts,
  wrapText,
} from "./shareCardCanvas";

export { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT };
export type { ShareCardStyle } from "./buildShareRhythm";
export {
  DEFAULT_SHARE_CARD_STYLE,
  SHARE_CARD_STYLE_OPTIONS,
} from "./buildShareRhythm";

export type ShareCardInput = {
  analysis: RouteAnalysis;
  title?: string;
  /** Default: airy (美感). */
  style?: ShareCardStyle;
};

/** Shared Moss & Dawn chrome — same across all three styles. */
const PANEL_X = 48;
const PANEL_Y = 300;
const PANEL_W = 984;
const PANEL_H = 1080;
const INSET_X = 96;
const SCORE_SIZE = 152;
const SCORE_BASELINE = 210;
const STATS_GAP = 78;
/** Mid content lives between these Ys; only this slot changes by style. */
const CONTENT_TOP = PANEL_Y + SCORE_BASELINE + STATS_GAP + 92;
const FOOTER_Y = 1188;
const SLOGAN = "Know the trail. Know yourself. Go smarter.";

function drawHairline(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = "rgba(42, 74, 51, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(INSET_X, y);
  ctx.lineTo(984, y);
  ctx.stroke();
}

function drawElevation(
  ctx: CanvasRenderingContext2D,
  samples: RouteAnalysis["elevationProfile"],
  x: number,
  y: number,
  w: number,
  h: number,
  hardest?: { startKm: number; endKm: number } | null,
) {
  if (samples.length < 2) return;
  const minEle = Math.min(...samples.map((s) => s.ele));
  const maxEle = Math.max(...samples.map((s) => s.ele));
  const maxKm = samples[samples.length - 1]!.km || 1;
  const span = Math.max(1, maxEle - minEle);
  const { serifSc } = SHARE_FONTS;

  ctx.save();
  roundRect(ctx, x, y, w, h, 16);
  ctx.clip();
  ctx.fillStyle = "rgba(42, 74, 51, 0.07)";
  ctx.fillRect(x, y, w, h);

  let hardestBand: { bx: number; bw: number } | null = null;
  if (hardest && maxKm > 0) {
    const bx = x + (hardest.startKm / maxKm) * w;
    const bw = Math.max(8, ((hardest.endKm - hardest.startKm) / maxKm) * w);
    hardestBand = { bx, bw };
    ctx.fillStyle = "rgba(139, 105, 20, 0.12)";
    ctx.fillRect(bx, y, bw, h);
  }

  const points = samples.map((s) => ({
    px: x + (s.km / maxKm) * w,
    py: y + h - ((s.ele - minEle) / span) * (h - 28) - 14,
  }));

  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, "rgba(63, 107, 74, 0.28)");
  grad.addColorStop(1, "rgba(63, 107, 74, 0.02)");
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.px, p.py);
    else ctx.lineTo(p.px, p.py);
  });
  ctx.lineTo(points[points.length - 1]!.px, y + h);
  ctx.lineTo(points[0]!.px, y + h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.px, p.py);
    else ctx.lineTo(p.px, p.py);
  });
  ctx.strokeStyle = "#2a4a33";
  ctx.lineWidth = 4;
  ctx.stroke();

  if (hardestBand) {
    const label = "最虐段";
    ctx.font = `600 18px ${serifSc}`;
    const lw = ctx.measureText(label).width;
    const padX = 10;
    const chipW = lw + padX * 2;
    const chipH = 28;
    const chipX = Math.min(
      Math.max(hardestBand.bx + 8, x + 12),
      x + w - chipW - 12,
    );
    const chipY = y + 14;
    roundRect(ctx, chipX, chipY, chipW, chipH, 8);
    ctx.fillStyle = "rgba(247, 243, 234, 0.92)";
    ctx.fill();
    ctx.fillStyle = "#8b6914";
    ctx.fillText(label, chipX + padX, chipY + 20);
  }

  ctx.restore();
}

function drawSharedChrome(
  ctx: CanvasRenderingContext2D,
  analysis: RouteAnalysis,
  personal: number,
  band: string,
) {
  const { display, serifSc, sans } = SHARE_FONTS;

  roundRect(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 28);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();

  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 28px ${serifSc}`;
  ctx.fillText("对你的吃力程度", INSET_X, PANEL_Y + 58);

  const scoreBaseline = PANEL_Y + SCORE_BASELINE;
  ctx.fillStyle = "#1c1a17";
  ctx.font = `700 ${SCORE_SIZE}px ${display}`;
  const scoreText = String(personal);
  ctx.fillText(scoreText, INSET_X, scoreBaseline);
  const scoreWidth = ctx.measureText(scoreText).width;

  const metaX = INSET_X + Math.max(scoreWidth + 24, SCORE_SIZE * 1.2);
  ctx.font = `600 32px ${sans}`;
  ctx.fillStyle = "#6b6560";
  ctx.fillText("/ 100", metaX, scoreBaseline - 84);

  ctx.fillStyle = "#2a4a33";
  ctx.font = `700 48px ${serifSc}`;
  ctx.fillText(band, metaX, scoreBaseline - 8);

  const statsY = scoreBaseline + STATS_GAP;
  const stats = [
    ["距离", `${analysis.route.distanceKm.toFixed(1)} km`],
    ["爬升", `+${analysis.route.elevationGainM} m`],
    [
      "预估",
      formatShareDuration(analysis.duration.lowMin, analysis.duration.highMin),
    ],
  ] as const;
  stats.forEach(([label, value], i) => {
    const sx = INSET_X + i * 300;
    ctx.fillStyle = "#7a746c";
    ctx.font = `500 22px ${sans}`;
    ctx.fillText(label, sx, statsY);
    ctx.fillStyle = "#1c1a17";
    ctx.font = `700 32px ${display}`;
    ctx.fillText(value, sx, statsY + 48);
  });
}

/** Fixed footer: hairline + risk (copy may vary) + slogan at same Y. */
function drawSharedFooter(ctx: CanvasRenderingContext2D, riskText: string) {
  const { serifSc, sans } = SHARE_FONTS;
  drawHairline(ctx, FOOTER_Y);

  ctx.fillStyle = "#1c1a17";
  ctx.font = `500 24px ${serifSc}`;
  const lines = wrapText(ctx, riskText, 880, 2);
  lines.forEach((line, i) => {
    ctx.fillText(line, INSET_X, FOOTER_Y + 48 + i * 38);
  });

  // Slogan always at the same baseline regardless of risk line count.
  ctx.fillStyle = "#8a847c";
  ctx.font = `500 20px ${sans}`;
  ctx.fillText(SLOGAN, INSET_X, FOOTER_Y + 160);
}

function kmRange(p: RhythmPhase): string {
  return `${p.startKm.toFixed(1)} – ${p.endKm.toFixed(1)} km`;
}

function drawSectionTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  hint?: string,
) {
  const { serifSc, sans } = SHARE_FONTS;
  drawHairline(ctx, CONTENT_TOP);
  const titleY = CONTENT_TOP + 42;
  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 26px ${serifSc}`;
  ctx.fillText(title, INSET_X, titleY);
  if (hint) {
    ctx.fillStyle = "#6b6560";
    ctx.font = `500 20px ${sans}`;
    const tw = ctx.measureText(title).width;
    ctx.fillText(hint, INSET_X + tw + 20, titleY);
  }
  return titleY + 36;
}

function renderAiryBody(ctx: CanvasRenderingContext2D, analysis: RouteAnalysis) {
  const { serifSc } = SHARE_FONTS;
  const bodyTop = drawSectionTitle(ctx, "海拔剖面");

  const segments = ensureSegmentEffort(analysis.segments);
  const hardest = findHardestStretch(segments);
  // Fill the mid slot without crowding the fixed footer.
  const chartH = Math.min(268, FOOTER_Y - bodyTop - 40);
  drawElevation(
    ctx,
    analysis.elevationProfile,
    INSET_X,
    bodyTop + 8,
    888,
    chartH,
    hardest,
  );
}

function renderBalancedBody(
  ctx: CanvasRenderingContext2D,
  analysis: RouteAnalysis,
) {
  const { serifSc, sans } = SHARE_FONTS;
  const bodyTop = drawSectionTitle(
    ctx,
    "全程难度节奏",
    "哪里开始虐 · 哪里可以松",
  );

  const phases = buildShareRhythm(analysis, "balanced");
  const cardTop = bodyTop + 12;
  const cardW = 292;
  const cardH = Math.min(236, FOOTER_Y - cardTop - 36);
  const gap = 18;

  phases.forEach((p, i) => {
    const x = INSET_X + i * (cardW + gap);
    ctx.save();
    roundRect(ctx, x, cardTop, cardW, cardH, 16);
    ctx.clip();
    ctx.fillStyle = p.peak ? "rgba(139, 105, 20, 0.1)" : "#f0ebe1";
    ctx.fillRect(x, cardTop, cardW, cardH);
    ctx.fillStyle = p.tone;
    ctx.fillRect(x, cardTop, cardW, 7);
    ctx.restore();

    roundRect(ctx, x, cardTop, cardW, cardH, 16);
    ctx.strokeStyle = p.peak
      ? "rgba(139, 105, 20, 0.28)"
      : "rgba(42, 74, 51, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = p.tone;
    ctx.font = `600 22px ${serifSc}`;
    ctx.fillText(p.feel, x + 18, cardTop + 46);

    ctx.fillStyle = "#1c1a17";
    ctx.font = `600 24px ${sans}`;
    const kmLines = wrapText(ctx, kmRange(p), cardW - 36, 2);
    kmLines.forEach((line, li) => {
      ctx.fillText(line, x + 18, cardTop + 88 + li * 28);
    });

    const textShift = kmLines.length > 1 ? 20 : 0;
    ctx.fillStyle = "#6b6560";
    ctx.font = `500 18px ${serifSc}`;
    ctx.fillText(p.line1, x + 18, cardTop + 130 + textShift);
    const line2 = wrapText(ctx, p.line2, cardW - 36, 1)[0] ?? p.line2;
    ctx.fillText(line2, x + 18, cardTop + 158 + textShift);

    if (p.peak && cardH >= 210) {
      roundRect(ctx, x + 18, cardTop + 182, 100, 28, 8);
      ctx.fillStyle = "rgba(139, 105, 20, 0.15)";
      ctx.fill();
      ctx.fillStyle = "#8b6914";
      ctx.font = `600 16px ${serifSc}`;
      ctx.fillText("今天最虐", x + 28, cardTop + 202);
    }
  });
}

function renderRichBody(ctx: CanvasRenderingContext2D, analysis: RouteAnalysis) {
  const { serifSc, sans } = SHARE_FONTS;
  const bodyTop = drawSectionTitle(
    ctx,
    "全程难度节奏",
    "公里段 · 海拔变化 · 体感",
  );

  const phases = buildShareRhythm(analysis, "rich");
  const avail = FOOTER_Y - bodyTop - 24;
  const rowH = Math.min(112, Math.floor(avail / Math.max(1, phases.length)));
  let y = bodyTop + 28;

  phases.forEach((r) => {
    if (r.peak) {
      roundRect(ctx, 88, y - 34, 904, Math.min(96, rowH - 12), 14);
      ctx.fillStyle = "rgba(139, 105, 20, 0.09)";
      ctx.fill();
    }
    ctx.fillStyle = "#1c1a17";
    ctx.font = `600 26px ${sans}`;
    ctx.fillText(kmRange(r), 104, y);

    ctx.font = `600 22px ${serifSc}`;
    const fw = ctx.measureText(r.feel).width;
    const chipX = 960 - fw - 36;
    roundRect(ctx, chipX - 12, y - 26, fw + 24, 34, 10);
    ctx.fillStyle = r.peak
      ? "rgba(139, 105, 20, 0.15)"
      : "rgba(42, 74, 51, 0.09)";
    ctx.fill();
    ctx.fillStyle = r.tone;
    ctx.fillText(r.feel, chipX, y);

    ctx.fillStyle = "#6b6560";
    ctx.font = `500 20px ${serifSc}`;
    const detail = `${r.line1} · ${r.line2}`;
    ctx.fillText(wrapText(ctx, detail, 760, 1)[0] ?? detail, 104, y + 34);

    if (rowH >= 90) {
      roundRect(ctx, 104, y + 48, 860, 7, 4);
      ctx.fillStyle = "rgba(42, 74, 51, 0.08)";
      ctx.fill();
      roundRect(ctx, 104, y + 48, Math.max(24, 860 * r.bar), 7, 4);
      ctx.fillStyle = r.tone;
      ctx.fill();
    }

    y += rowH;
  });
}

/**
 * Render a 3:4 PNG card sized for Xiaohongshu posts.
 * Shared chrome (brand, score, stats, risk, slogan); style only swaps mid body.
 */
export async function renderShareCardPng(
  input: ShareCardInput,
): Promise<Blob> {
  await waitForShareFonts();

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const {
    analysis,
    title = "路线分析",
    style = DEFAULT_SHARE_CARD_STYLE,
  } = input;
  const personal = analysis.personalDifficulty.overall;
  const band = scoreBand(personal);

  const segments = ensureSegmentEffort(analysis.segments);
  const hardest = findHardestStretch(segments);
  const risk = shareRiskLine(analysis, hardest);

  drawMossAtmosphere(ctx);
  drawBrandHeader(ctx);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 56px ${SHARE_FONTS.serifSc}`;
  const titleLines = wrapText(ctx, title, 936, 2);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, 72, 230 + i * 64);
  });

  drawSharedChrome(ctx, analysis, personal, band);

  if (style === "balanced") {
    renderBalancedBody(ctx, analysis);
  } else if (style === "rich") {
    renderRichBody(ctx, analysis);
  } else {
    renderAiryBody(ctx, analysis);
  }

  drawSharedFooter(ctx, risk);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("PNG encode failed"));
      },
      "image/png",
      0.95,
    );
  });
}
