import { scoreBand, type RouteAnalysis } from "@/lib/engine";
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

export type ShareCardInput = {
  analysis: RouteAnalysis;
  title?: string;
};

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} 分钟`;
  return `${h} h ${m} m`;
}

function drawElevation(
  ctx: CanvasRenderingContext2D,
  samples: RouteAnalysis["elevationProfile"],
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (samples.length < 2) return;
  const minEle = Math.min(...samples.map((s) => s.ele));
  const maxEle = Math.max(...samples.map((s) => s.ele));
  const maxKm = samples[samples.length - 1].km || 1;
  const span = Math.max(1, maxEle - minEle);

  ctx.save();
  roundRect(ctx, x, y, w, h, 18);
  ctx.clip();
  ctx.fillStyle = "rgba(42, 74, 51, 0.08)";
  ctx.fillRect(x, y, w, h);

  const points = samples.map((s) => ({
    px: x + (s.km / maxKm) * w,
    py: y + h - ((s.ele - minEle) / span) * (h - 24) - 12,
  }));

  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, "rgba(63, 107, 74, 0.28)");
  grad.addColorStop(1, "rgba(63, 107, 74, 0.02)");
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.px, p.py);
    else ctx.lineTo(p.px, p.py);
  });
  ctx.lineTo(points[points.length - 1].px, y + h);
  ctx.lineTo(points[0].px, y + h);
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
  ctx.restore();
}

/**
 * Render a 3:4 PNG card sized for Xiaohongshu posts.
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

  const { analysis, title = "路线分析" } = input;
  const personal = analysis.personalDifficulty.overall;
  const base = analysis.baseDifficulty.overall;
  const band = scoreBand(personal);
  const { route, duration, recommendation, elevationProfile } = analysis;
  const { display, serifSc, sans } = SHARE_FONTS;

  drawMossAtmosphere(ctx);
  drawBrandHeader(ctx);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 64px ${display}`;
  const titleLines = wrapText(ctx, title, 936, 2);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, 72, 250 + i * 74);
  });

  const panelY = 420;
  roundRect(ctx, 48, panelY, 984, 920, 28);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();

  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 30px ${serifSc}`;
  ctx.fillText("对你的吃力程度", 96, panelY + 64);

  const scoreBaseline = panelY + 248;
  ctx.fillStyle = "#1c1a17";
  ctx.font = `700 168px ${display}`;
  const scoreText = String(personal);
  ctx.fillText(scoreText, 96, scoreBaseline);
  const scoreMetrics = ctx.measureText(scoreText);
  const scoreWidth = scoreMetrics.width;
  const scoreDescent =
    scoreMetrics.actualBoundingBoxDescent > 0
      ? scoreMetrics.actualBoundingBoxDescent
      : 168 * 0.22;

  const metaX = 96 + scoreWidth + 28;
  ctx.font = `600 34px ${sans}`;
  ctx.fillStyle = "#6b6560";
  ctx.fillText("/ 100", metaX, scoreBaseline - 92);

  ctx.fillStyle = "#2a4a33";
  ctx.font = `700 52px ${serifSc}`;
  ctx.fillText(band, metaX, scoreBaseline - 12);

  const afterScoreY = scoreBaseline + Math.ceil(scoreDescent) + 36;
  ctx.fillStyle = "#6b6560";
  ctx.font = `500 28px ${sans}`;
  ctx.fillText(`路线基础负荷 ${base}`, 96, afterScoreY);

  const statsY = afterScoreY + 64;
  const stats = [
    ["距离", `${route.distanceKm.toFixed(1)} km`],
    ["爬升", `+${route.elevationGainM} m`],
    [
      "预估",
      `${formatDuration(duration.lowMin)} – ${formatDuration(duration.highMin)}`,
    ],
  ] as const;
  stats.forEach(([label, value], i) => {
    const sx = 96 + i * 300;
    ctx.fillStyle = "#6b6560";
    ctx.font = `500 24px ${sans}`;
    ctx.fillText(label, sx, statsY);
    ctx.fillStyle = "#1c1a17";
    ctx.font = `700 32px ${display}`;
    const valueLines = wrapText(ctx, value, 280, 2);
    valueLines.forEach((line, li) => {
      ctx.fillText(line, sx, statsY + 44 + li * 36);
    });
  });

  const elevY = statsY + 120;
  drawElevation(ctx, elevationProfile, 96, elevY, 888, 160);

  ctx.fillStyle = "#1c1a17";
  ctx.font = `500 28px ${serifSc}`;
  const risk = recommendation.mainRisk
    ? `主风险：${recommendation.mainRisk}`
    : "Know the trail. Know yourself. Go smarter.";
  const riskLines = wrapText(ctx, risk, 888, 2);
  riskLines.forEach((line, i) => {
    ctx.fillText(line, 96, elevY + 220 + i * 40);
  });

  ctx.fillStyle = "#6b6560";
  ctx.font = `500 24px ${sans}`;
  ctx.fillText(
    "Know the trail. Know yourself. Go smarter.",
    96,
    elevY + 320,
  );

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
