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

function drawHairline(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = "rgba(42, 74, 51, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(96, y);
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

  // Label lives inside the chart so it never collides with section titles.
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

function drawScoreBlock(
  ctx: CanvasRenderingContext2D,
  panelY: number,
  personal: number,
  band: string,
  opts: { scoreSize: number; scoreBaseline: number },
): number {
  const { display, serifSc, sans } = SHARE_FONTS;
  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 28px ${serifSc}`;
  ctx.fillText("对你的吃力程度", 96, panelY + 58);

  const scoreBaseline = panelY + opts.scoreBaseline;
  ctx.fillStyle = "#1c1a17";
  ctx.font = `700 ${opts.scoreSize}px ${display}`;
  const scoreText = String(personal);
  ctx.fillText(scoreText, 96, scoreBaseline);
  const scoreWidth = ctx.measureText(scoreText).width;

  const metaX = 96 + Math.max(scoreWidth + 24, opts.scoreSize * 1.2);
  ctx.font = `600 32px ${sans}`;
  ctx.fillStyle = "#6b6560";
  ctx.fillText("/ 100", metaX, scoreBaseline - 84);

  ctx.fillStyle = "#2a4a33";
  ctx.font = `700 48px ${serifSc}`;
  ctx.fillText(band, metaX, scoreBaseline - 8);

  return scoreBaseline;
}

function drawStats(
  ctx: CanvasRenderingContext2D,
  statsY: number,
  analysis: RouteAnalysis,
) {
  const { display, sans } = SHARE_FONTS;
  const stats = [
    ["距离", `${analysis.route.distanceKm.toFixed(1)} km`],
    ["爬升", `+${analysis.route.elevationGainM} m`],
    [
      "预估",
      formatShareDuration(analysis.duration.lowMin, analysis.duration.highMin),
    ],
  ] as const;
  stats.forEach(([label, value], i) => {
    const sx = 96 + i * 300;
    ctx.fillStyle = "#7a746c";
    ctx.font = `500 22px ${sans}`;
    ctx.fillText(label, sx, statsY);
    ctx.fillStyle = "#1c1a17";
    ctx.font = `700 32px ${display}`;
    ctx.fillText(value, sx, statsY + 48);
  });
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  y: number,
  riskText: string,
) {
  const { serifSc, sans } = SHARE_FONTS;
  drawHairline(ctx, y);
  ctx.fillStyle = "#1c1a17";
  ctx.font = `500 24px ${serifSc}`;
  const lines = wrapText(ctx, riskText, 880, 2);
  lines.forEach((line, i) => ctx.fillText(line, 96, y + 48 + i * 38));
  ctx.fillStyle = "#8a847c";
  ctx.font = `500 20px ${sans}`;
  ctx.fillText(
    "Know the trail. Know yourself. Go smarter.",
    96,
    y + 48 + lines.length * 38 + 36,
  );
}

function kmRange(p: RhythmPhase): string {
  return `${p.startKm.toFixed(1)} – ${p.endKm.toFixed(1)} km`;
}

function renderAiry(
  ctx: CanvasRenderingContext2D,
  analysis: RouteAnalysis,
  personal: number,
  band: string,
  risk: string,
) {
  const { serifSc } = SHARE_FONTS;
  const panelY = 320;
  roundRect(ctx, 48, panelY, 984, 1020, 28);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();

  // Slightly airier score + stats rhythm (less packed than before).
  const scoreBaseline = drawScoreBlock(ctx, panelY, personal, band, {
    scoreSize: 160,
    scoreBaseline: 236,
  });
  drawStats(ctx, scoreBaseline + 88, analysis);

  const elevHeaderY = scoreBaseline + 230;
  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 28px ${serifSc}`;
  ctx.fillText("海拔剖面", 96, elevHeaderY);

  const segments = ensureSegmentEffort(analysis.segments);
  const hardest = findHardestStretch(segments);
  const elevChartY = elevHeaderY + 48;
  drawElevation(
    ctx,
    analysis.elevationProfile,
    96,
    elevChartY,
    888,
    248,
    hardest,
  );

  drawFooter(ctx, elevChartY + 292, risk);
}

function renderBalanced(
  ctx: CanvasRenderingContext2D,
  analysis: RouteAnalysis,
  personal: number,
  band: string,
  risk: string,
) {
  const { serifSc, sans } = SHARE_FONTS;
  const panelY = 300;
  roundRect(ctx, 48, panelY, 984, 1080, 28);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();

  const scoreBaseline = drawScoreBlock(ctx, panelY, personal, band, {
    scoreSize: 148,
    scoreBaseline: 205,
  });
  drawStats(ctx, scoreBaseline + 72, analysis);

  let y = scoreBaseline + 158;
  drawHairline(ctx, y);
  y += 42;
  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 26px ${serifSc}`;
  ctx.fillText("全程难度节奏", 96, y);
  ctx.fillStyle = "#6b6560";
  ctx.font = `500 20px ${sans}`;
  ctx.fillText("哪里开始虐 · 哪里可以松", 280, y);

  const phases = buildShareRhythm(analysis, "balanced");
  const cardTop = y + 40;
  const cardW = 292;
  const cardH = 236;
  const gap = 18;

  phases.forEach((p, i) => {
    const x = 96 + i * (cardW + gap);
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

    ctx.fillStyle = "#6b6560";
    ctx.font = `500 18px ${serifSc}`;
    ctx.fillText(p.line1, x + 18, cardTop + 130 + (kmLines.length > 1 ? 20 : 0));
    const line2 = wrapText(ctx, p.line2, cardW - 36, 1)[0] ?? p.line2;
    ctx.fillText(line2, x + 18, cardTop + 158 + (kmLines.length > 1 ? 20 : 0));

    if (p.peak) {
      roundRect(ctx, x + 18, cardTop + 182, 100, 28, 8);
      ctx.fillStyle = "rgba(139, 105, 20, 0.15)";
      ctx.fill();
      ctx.fillStyle = "#8b6914";
      ctx.font = `600 16px ${serifSc}`;
      ctx.fillText("今天最虐", x + 28, cardTop + 202);
    }
  });

  drawFooter(ctx, cardTop + cardH + 64, risk);
}

function renderRich(
  ctx: CanvasRenderingContext2D,
  analysis: RouteAnalysis,
  personal: number,
  band: string,
  risk: string,
) {
  const { serifSc, sans } = SHARE_FONTS;
  const panelY = 300;
  roundRect(ctx, 48, panelY, 984, 1080, 28);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();

  const scoreBaseline = drawScoreBlock(ctx, panelY, personal, band, {
    scoreSize: 140,
    scoreBaseline: 195,
  });
  drawStats(ctx, scoreBaseline + 68, analysis);

  let y = scoreBaseline + 150;
  drawHairline(ctx, y);
  y += 42;
  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 26px ${serifSc}`;
  ctx.fillText("全程难度节奏", 96, y);
  ctx.fillStyle = "#6b6560";
  ctx.font = `500 20px ${sans}`;
  ctx.fillText("公里段 · 海拔变化 · 体感", 280, y);

  const phases = buildShareRhythm(analysis, "rich");
  y += 40;
  phases.forEach((r, i) => {
    const rowY = y + i * 112;
    if (r.peak) {
      roundRect(ctx, 88, rowY - 34, 904, 96, 14);
      ctx.fillStyle = "rgba(139, 105, 20, 0.09)";
      ctx.fill();
    }
    ctx.fillStyle = "#1c1a17";
    ctx.font = `600 26px ${sans}`;
    ctx.fillText(kmRange(r), 104, rowY);

    ctx.font = `600 22px ${serifSc}`;
    const fw = ctx.measureText(r.feel).width;
    const chipX = 960 - fw - 36;
    roundRect(ctx, chipX - 12, rowY - 26, fw + 24, 34, 10);
    ctx.fillStyle = r.peak
      ? "rgba(139, 105, 20, 0.15)"
      : "rgba(42, 74, 51, 0.09)";
    ctx.fill();
    ctx.fillStyle = r.tone;
    ctx.fillText(r.feel, chipX, rowY);

    ctx.fillStyle = "#6b6560";
    ctx.font = `500 20px ${serifSc}`;
    const detail = `${r.line1} · ${r.line2}`;
    ctx.fillText(wrapText(ctx, detail, 760, 1)[0] ?? detail, 104, rowY + 34);

    roundRect(ctx, 104, rowY + 48, 860, 7, 4);
    ctx.fillStyle = "rgba(42, 74, 51, 0.08)";
    ctx.fill();
    roundRect(ctx, 104, rowY + 48, Math.max(24, 860 * r.bar), 7, 4);
    ctx.fillStyle = r.tone;
    ctx.fill();
  });

  drawFooter(ctx, y + phases.length * 112 + 36, risk);
}

/**
 * Render a 3:4 PNG card sized for Xiaohongshu posts.
 * Styles: airy (default) | balanced | rich.
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

  if (style === "balanced") {
    renderBalanced(ctx, analysis, personal, band, risk);
  } else if (style === "rich") {
    renderRich(ctx, analysis, personal, band, risk);
  } else {
    renderAiry(ctx, analysis, personal, band, risk);
  }

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
