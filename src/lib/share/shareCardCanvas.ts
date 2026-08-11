/** Shared Moss & Dawn canvas helpers for Xiaohongshu 3:4 cards. */

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1440;

export const SHARE_FONTS = {
  display: 'Cormorant, "Iowan Old Style", "Palatino Linotype", Georgia, serif',
  serifSc:
    '"Noto Serif SC", "Songti SC", "PingFang SC", "Hiragino Sans GB", serif',
  sans: 'Raleway, "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif',
} as const;

export function roundRect(
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

export function wrapText(
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
    if (last && ctx.measureText(last).width > maxWidth - 20) {
      lines[maxLines - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
    }
  }
  return lines;
}

export async function waitForShareFonts(): Promise<void> {
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

/** Full-bleed Moss & Dawn gradient + soft washes. */
export function drawMossAtmosphere(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, 0, SHARE_CARD_HEIGHT);
  bg.addColorStop(0, "#1a241c");
  bg.addColorStop(0.36, "#2c3a2e");
  bg.addColorStop(0.36, "#f3efe6");
  bg.addColorStop(1, "#ebe4d6");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

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
}

export function drawBrandHeader(ctx: CanvasRenderingContext2D) {
  const { sans, serifSc } = SHARE_FONTS;
  ctx.fillStyle = "#f3efe6";
  ctx.font = `600 28px ${sans}`;
  ctx.fillText("OUTDOOR COPILOT", 72, 88);
  ctx.font = `600 44px ${serifSc}`;
  ctx.fillStyle = "#e8d9c0";
  ctx.fillText("个人户外智能", 72, 150);
}

/** Split title on newlines; wrap each paragraph. */
export function titleLinesFrom(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const parts = title
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    if (out.length >= maxLines) break;
    const wrapped = wrapText(ctx, part, maxWidth, maxLines - out.length);
    out.push(...wrapped);
  }
  return out.length ? out : ["Outdoor Copilot"];
}
