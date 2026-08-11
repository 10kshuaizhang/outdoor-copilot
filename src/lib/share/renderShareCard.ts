import { scoreBand, type RouteAnalysis } from "@/lib/engine";

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1440;

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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function waitForFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.ready) return;
  try {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('600 64px "Noto Serif SC"'),
      document.fonts.load("700 120px Cormorant"),
      document.fonts.load("500 36px Raleway"),
    ]);
  } catch {
    // System fallbacks are fine on mobile.
  }
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
  await waitForFonts();

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

  // Moss & Dawn atmosphere (no pink)
  const bg = ctx.createLinearGradient(0, 0, 0, SHARE_CARD_HEIGHT);
  bg.addColorStop(0, "#1a241c");
  bg.addColorStop(0.36, "#2c3a2e");
  bg.addColorStop(0.36, "#f3efe6");
  bg.addColorStop(1, "#ebe4d6");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  // Soft dawn wash
  const wash = ctx.createRadialGradient(920, 100, 30, 800, 160, 520);
  wash.addColorStop(0, "rgba(232, 217, 192, 0.35)");
  wash.addColorStop(1, "rgba(232, 217, 192, 0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, 560);

  const pineWash = ctx.createRadialGradient(180, 420, 20, 220, 380, 280);
  pineWash.addColorStop(0, "rgba(63, 107, 74, 0.18)");
  pineWash.addColorStop(1, "rgba(63, 107, 74, 0)");
  ctx.fillStyle = pineWash;
  ctx.fillRect(0, 200, 520, 360);

  const display =
    'Cormorant, "Iowan Old Style", "Palatino Linotype", Georgia, serif';
  const serifSc =
    '"Noto Serif SC", "Songti SC", "PingFang SC", "Hiragino Sans GB", serif';
  const sans =
    'Raleway, "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif';

  ctx.fillStyle = "#f3efe6";
  ctx.font = `600 28px ${sans}`;
  ctx.fillText("OUTDOOR COPILOT", 72, 88);
  ctx.font = `600 44px ${serifSc}`;
  ctx.fillStyle = "#e8d9c0";
  ctx.fillText("个人户外智能", 72, 150);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 64px ${display}`;
  const titleLines = wrapText(ctx, title, 936, 2);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, 72, 250 + i * 74);
  });

  // Cream panel
  const panelY = 420;
  roundRect(ctx, 48, panelY, 984, 920, 28);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();

  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 30px ${serifSc}`;
  ctx.fillText("对你的吃力程度", 96, panelY + 64);

  ctx.fillStyle = "#1c1a17";
  ctx.font = `700 168px ${display}`;
  const scoreText = String(personal);
  ctx.fillText(scoreText, 96, panelY + 230);
  const scoreWidth = ctx.measureText(scoreText).width;
  ctx.font = `600 34px ${sans}`;
  ctx.fillStyle = "#6b6560";
  ctx.fillText("/ 100", 96 + scoreWidth + 28, panelY + 150);

  ctx.fillStyle = "#2a4a33";
  ctx.font = `700 56px ${serifSc}`;
  ctx.fillText(band, 96, panelY + 300);

  ctx.fillStyle = "#6b6560";
  ctx.font = `500 28px ${sans}`;
  ctx.fillText(`路线基础负荷 ${base}`, 96, panelY + 350);

  // Stats
  const statsY = panelY + 410;
  const stats = [
    ["距离", `${route.distanceKm.toFixed(1)} km`],
    ["爬升", `+${route.elevationGainM} m`],
    [
      "预估",
      `${formatDuration(duration.lowMin)}–${formatDuration(duration.highMin)}`,
    ],
  ] as const;
  stats.forEach(([label, value], i) => {
    const sx = 96 + i * 300;
    ctx.fillStyle = "#6b6560";
    ctx.font = `500 24px ${sans}`;
    ctx.fillText(label, sx, statsY);
    ctx.fillStyle = "#1c1a17";
    ctx.font = `700 36px ${display}`;
    ctx.fillText(value, sx, statsY + 48);
  });

  drawElevation(ctx, elevationProfile, 96, panelY + 520, 888, 160);

  ctx.fillStyle = "#1c1a17";
  ctx.font = `500 28px ${serifSc}`;
  const risk = recommendation.mainRisk
    ? `主风险：${recommendation.mainRisk}`
    : "Know the trail. Know yourself. Go smarter.";
  const riskLines = wrapText(ctx, risk, 888, 2);
  riskLines.forEach((line, i) => {
    ctx.fillText(line, 96, panelY + 740 + i * 40);
  });

  ctx.fillStyle = "#6b6560";
  ctx.font = `500 24px ${sans}`;
  ctx.fillText("Know the trail. Know yourself. Go smarter.", 96, panelY + 860);

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const chars = [...text];
  const lines: string[] = [];
  let current = "";
  for (const ch of chars) {
    const next = current + ch;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = ch;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth - 20) {
      lines[maxLines - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
    }
  }
  return lines;
}
