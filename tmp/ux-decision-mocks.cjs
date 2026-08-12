/**
 * UX mocks: live personal-report first screen vs proposed decision-first layout.
 * Same Moss & Dawn tokens as Outdoor Copilot.
 */
const { createCanvas, GlobalFonts, loadImage } = require("@napi-rs/canvas");
const fs = require("node:fs");
const path = require("node:path");

GlobalFonts.registerFromPath("/tmp/xhs-fonts/cormorant.ttf", "Cormorant");
GlobalFonts.registerFromPath("/tmp/xhs-fonts/raleway.ttf", "Raleway");
GlobalFonts.registerFromPath(
  "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
  "MicroHei",
);

const display = "Cormorant";
const zh = "MicroHei";
const sans = "Raleway";

const W = 390;
const H = 844;
const OUT = path.resolve("/agent/public");

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function paintAtmosphere(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#f7f3ea");
  g.addColorStop(1, "#ebe4d6");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const wash = ctx.createRadialGradient(40, 0, 10, 80, 40, 220);
  wash.addColorStop(0, "rgba(232,217,192,0.55)");
  wash.addColorStop(1, "rgba(232,217,192,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, 280);
}

function drawPhoneChrome(ctx, label, badge) {
  // status-ish bar
  ctx.fillStyle = "#1a241c";
  ctx.fillRect(0, 0, W, 36);
  ctx.fillStyle = "#e8d9c0";
  ctx.font = `600 12px ${sans}`;
  ctx.fillText(label, 14, 23);
  roundRect(ctx, W - 92, 8, 78, 20, 6);
  ctx.fillStyle = badge === "live" ? "rgba(196,165,116,0.35)" : "rgba(63,107,74,0.45)";
  ctx.fill();
  ctx.fillStyle = "#f3efe6";
  ctx.font = `600 11px ${zh}`;
  ctx.fillText(badge === "live" ? "线上现状" : "改版模拟", W - 84, 22);
}

/** Approximate current personal first screen (verbose). */
function renderLiveApprox() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  paintAtmosphere(ctx);
  drawPhoneChrome(ctx, "outdoor.shuaiz.com", "live");

  let y = 52;
  ctx.fillStyle = "#2a4a33";
  ctx.font = `500 13px ${zh}`;
  ctx.fillText("← Outdoor Copilot", 20, y);
  y += 28;
  ctx.fillText("← 换一条路线", 20, y);
  y += 36;

  ctx.fillStyle = "#1c1a17";
  ctx.font = `700 32px ${display}`;
  ctx.fillText("海坨山", 20, y);
  y += 28;

  // Prediction panel
  roundRect(ctx, 16, y, W - 32, 210, 14);
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(28,26,23,0.1)";
  ctx.stroke();

  let iy = y + 28;
  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 12px ${zh}`;
  ctx.fillText("这次预测", 32, iy);
  iy += 28;
  ctx.fillStyle = "#6b6560";
  ctx.font = `500 12px ${zh}`;
  ctx.fillText("个人难度", 32, iy);
  iy += 42;
  ctx.fillStyle = "#2a4a33";
  ctx.font = `700 52px ${display}`;
  ctx.fillText("51", 32, iy);
  ctx.fillStyle = "#6b6560";
  ctx.font = `500 14px ${sans}`;
  ctx.fillText("/ 100", 98, iy - 28);
  ctx.fillStyle = "#c4a574";
  ctx.font = `700 20px ${zh}`;
  ctx.fillText("适中", 98, iy - 4);
  iy += 24;
  ctx.fillStyle = "#2a4a33";
  ctx.font = `600 13px ${zh}`;
  ctx.fillText("新手不宜 · 海坨山户外天气｜新手不宜", 32, iy);
  iy += 28;
  ctx.fillStyle = "#6b6560";
  ctx.font = `500 12px ${zh}`;
  ctx.fillText("预估时长", 32, iy);
  iy += 20;
  ctx.fillStyle = "#1c1a17";
  ctx.font = `600 14px ${zh}`;
  ctx.fillText("3 小时 59 分钟 – 5 小时 6 分钟", 32, iy);

  y += 226;
  // buttons
  roundRect(ctx, 16, y, W - 32, 44, 8);
  ctx.fillStyle = "#2a4a33";
  ctx.fill();
  ctx.fillStyle = "#f3efe6";
  ctx.font = `600 14px ${zh}`;
  ctx.fillText("保存这次预测", 140, y + 28);
  y += 56;
  roundRect(ctx, 16, y, W - 32, 44, 8);
  ctx.strokeStyle = "#2a4a33";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#2a4a33";
  ctx.font = `600 14px ${zh}`;
  ctx.fillText("我要去这次徒步", 132, y + 28);
  y += 64;

  ctx.fillStyle = "#6b6560";
  ctx.font = `500 12px ${zh}`;
  ctx.fillText("路线基础 59  ·  对你 51", 20, y);
  y += 28;
  // stats
  const stats = [
    ["距离", "8.8 km"],
    ["爬升", "+682 m"],
    ["预估", "4–5 h"],
    ["海拔", "1848 m"],
  ];
  stats.forEach(([a, b], i) => {
    const sx = 20 + (i % 2) * 180;
    const sy = y + Math.floor(i / 2) * 48;
    ctx.fillStyle = "#6b6560";
    ctx.font = `500 11px ${zh}`;
    ctx.fillText(a, sx, sy);
    ctx.fillStyle = "#1c1a17";
    ctx.font = `700 16px ${display}`;
    ctx.fillText(b, sx, sy + 22);
  });
  y += 110;

  // long brief start — the "啰嗦" signal
  roundRect(ctx, 16, y, W - 32, 160, 12);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fill();
  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 12px ${zh}`;
  ctx.fillText("徒步简报", 32, y + 26);
  ctx.fillStyle = "#1c1a17";
  ctx.font = `700 18px ${display}`;
  ctx.fillText("海坨山户外天气｜新手不宜", 32, y + 54);
  ctx.fillStyle = "#6b6560";
  ctx.font = `500 12px ${zh}`;
  const lines = [
    "天气分项 · 多模型 · 降雨 · 风力…",
    "穿衣建议 · 装备清单 · 出片提示…",
    "分段叙述 · 行动建议 · 长文正文…",
    "（首屏已被长文占满，未见轨迹图）",
  ];
  lines.forEach((l, i) => ctx.fillText(l, 32, y + 80 + i * 18));

  // red callouts as annotations outside phone? draw thin note at bottom
  ctx.fillStyle = "#8b3a3a";
  ctx.font = `600 11px ${zh}`;
  ctx.fillText("问题：结论弱 · 无轨迹形状 · 简报先铺开", 20, H - 18);

  fs.writeFileSync(path.join(OUT, "ux-mock-live-personal.png"), canvas.toBuffer("image/png"));
  console.log("wrote live mock");
}

/** Proposed decision-first first screen. */
function renderProposed() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  paintAtmosphere(ctx);
  drawPhoneChrome(ctx, "改版 · 个人决策", "mock");

  let y = 52;
  ctx.fillStyle = "#2a4a33";
  ctx.font = `500 13px ${zh}`;
  ctx.fillText("← Outdoor Copilot", 20, y);
  y += 26;
  ctx.fillText("← 换一条路线", 20, y);
  y += 34;

  ctx.fillStyle = "#1c1a17";
  ctx.font = `700 30px ${display}`;
  ctx.fillText("海坨山", 20, y);
  y += 18;

  // VERDICT hero — one composition
  roundRect(ctx, 16, y, W - 32, 520, 16);
  ctx.fillStyle = "#1a241c";
  ctx.fill();
  // dawn wash
  const wash = ctx.createRadialGradient(300, y + 40, 10, 280, y + 60, 180);
  wash.addColorStop(0, "rgba(232,217,192,0.28)");
  wash.addColorStop(1, "rgba(232,217,192,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(16, y, W - 32, 200);

  let iy = y + 36;
  ctx.fillStyle = "#e8d9c0";
  ctx.font = `600 12px ${zh}`;
  ctx.fillText("结论", 36, iy);
  iy += 34;
  ctx.fillStyle = "#f3efe6";
  ctx.font = `700 28px ${zh}`;
  ctx.fillText("新手不宜", 36, iy);
  iy += 28;
  ctx.fillStyle = "rgba(243,239,230,0.72)";
  ctx.font = `500 13px ${zh}`;
  ctx.fillText("主风险：3.8–4.1 km 连续爬升", 36, iy);

  // score row
  iy += 48;
  ctx.fillStyle = "#f3efe6";
  ctx.font = `700 56px ${display}`;
  ctx.fillText("51", 36, iy);
  ctx.fillStyle = "rgba(243,239,230,0.65)";
  ctx.font = `500 14px ${sans}`;
  ctx.fillText("/ 100", 110, iy - 30);
  ctx.fillStyle = "#c4a574";
  ctx.font = `700 20px ${zh}`;
  ctx.fillText("适中 · 对你", 110, iy - 4);

  // TRAIL MAP block
  iy += 24;
  const mapX = 32;
  const mapY = iy;
  const mapW = W - 64;
  const mapH = 168;
  roundRect(ctx, mapX, mapY, mapW, mapH, 12);
  ctx.fillStyle = "#243028";
  ctx.fill();

  // fake trail polyline (haituo-ish loop)
  const trail = [
    [0.12, 0.72],
    [0.22, 0.58],
    [0.35, 0.48],
    [0.48, 0.28],
    [0.58, 0.18],
    [0.68, 0.22],
    [0.78, 0.38],
    [0.86, 0.55],
    [0.78, 0.7],
    [0.62, 0.78],
    [0.45, 0.82],
    [0.28, 0.78],
    [0.12, 0.72],
  ];
  // hardest band highlight
  ctx.fillStyle = "rgba(139,105,20,0.28)";
  ctx.fillRect(mapX + mapW * 0.42, mapY + 12, mapW * 0.18, mapH - 24);

  ctx.beginPath();
  trail.forEach(([tx, ty], i) => {
    const px = mapX + tx * mapW;
    const py = mapY + ty * mapH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = "#e8d9c0";
  ctx.lineWidth = 3;
  ctx.stroke();

  // start / end
  ctx.fillStyle = "#3f6b4a";
  ctx.beginPath();
  ctx.arc(mapX + trail[0][0] * mapW, mapY + trail[0][1] * mapH, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c4a574";
  ctx.beginPath();
  ctx.arc(
    mapX + trail[trail.length - 2][0] * mapW,
    mapY + trail[trail.length - 2][1] * mapH,
    5,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.fillStyle = "#e8d9c0";
  ctx.font = `600 11px ${zh}`;
  ctx.fillText("轨迹形状 · 黄标最虐段", mapX + 12, mapY + 22);

  iy = mapY + mapH + 28;
  // three hard numbers
  const row = [
    ["8.8 km", "距离"],
    ["+682 m", "爬升"],
    ["4–5 h", "预估"],
  ];
  row.forEach(([v, l], i) => {
    const sx = 36 + i * 110;
    ctx.fillStyle = "#f3efe6";
    ctx.font = `700 18px ${display}`;
    ctx.fillText(v, sx, iy);
    ctx.fillStyle = "rgba(243,239,230,0.55)";
    ctx.font = `500 11px ${zh}`;
    ctx.fillText(l, sx, iy + 18);
  });

  y += 536;

  // collapsed details
  roundRect(ctx, 16, y, W - 32, 48, 12);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();
  ctx.fillStyle = "#2a4a33";
  ctx.font = `600 14px ${zh}`;
  ctx.fillText("▸  展开详情（天气 / 穿衣 / 全文简报）", 32, y + 30);
  y += 64;

  roundRect(ctx, 16, y, W - 32, 48, 10);
  ctx.fillStyle = "#c4a574";
  ctx.fill();
  ctx.fillStyle = "#1c1a17";
  ctx.font = `700 14px ${zh}`;
  ctx.fillText("保存到我的计划", 128, y + 30);
  y += 60;
  roundRect(ctx, 16, y, (W - 40) / 2, 44, 10);
  ctx.strokeStyle = "#2a4a33";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#2a4a33";
  ctx.font = `600 13px ${zh}`;
  ctx.fillText("分享图", 16 + 58, y + 28);
  roundRect(ctx, 16 + (W - 40) / 2 + 8, y, (W - 40) / 2, 44, 10);
  ctx.stroke();
  ctx.fillText("海拔剖面", 16 + (W - 40) / 2 + 52, y + 28);

  // annotation sits in chrome below content, not over buttons
  ctx.fillStyle = "#3f6b4a";
  ctx.font = `600 11px ${zh}`;
  ctx.fillText("首屏只答：去不去 · 对我几分 · 难在哪 · 线长什么样", 20, Math.min(H - 14, y + 68));

  fs.writeFileSync(path.join(OUT, "ux-mock-decision-first.png"), canvas.toBuffer("image/png"));
  console.log("wrote proposed mock");
}

async function renderCompare() {
  const leftPath = path.join(OUT, "ux-mock-live-personal.png");
  const rightPath = path.join(OUT, "ux-mock-decision-first.png");
  const liveShot = "/tmp/computer-use/d32ed.webp";

  const left = await loadImage(leftPath);
  const right = await loadImage(rightPath);

  const pad = 28;
  const gap = 24;
  const phoneW = 360;
  const phoneH = Math.round((phoneW / W) * H);
  const cw = pad * 2 + phoneW * 2 + gap + 40;
  const ch = pad + 70 + phoneH + 90;

  const canvas = createCanvas(cw, ch);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1a241c";
  ctx.fillRect(0, 0, cw, ch);
  const wash = ctx.createRadialGradient(cw * 0.7, 0, 20, cw * 0.6, 80, 420);
  wash.addColorStop(0, "rgba(232,217,192,0.22)");
  wash.addColorStop(1, "rgba(232,217,192,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, cw, 320);

  ctx.fillStyle = "#e8d9c0";
  ctx.font = `600 14px ${sans}`;
  ctx.fillText("OUTDOOR COPILOT · UX", pad, 36);
  ctx.fillStyle = "#f3efe6";
  ctx.font = `700 28px ${zh}`;
  ctx.fillText("个人决策首屏 · 线上 vs 改版模拟", pad, 72);

  const y0 = 96;
  ctx.drawImage(left, pad, y0, phoneW, phoneH);
  ctx.drawImage(right, pad + phoneW + gap, y0, phoneW, phoneH);

  ctx.fillStyle = "#c4a574";
  ctx.font = `600 13px ${zh}`;
  ctx.fillText("左：线上（结构还原）", pad, y0 + phoneH + 28);
  ctx.fillStyle = "#9ec5a6";
  ctx.fillText("右：个人决策改版模拟", pad + phoneW + gap, y0 + phoneH + 28);

  ctx.fillStyle = "rgba(243,239,230,0.65)";
  ctx.font = `500 12px ${zh}`;
  ctx.fillText(
    "差异：结论置顶 · 增加轨迹形状 · 长简报默认折叠 · CTA 改为「我的计划」",
    pad,
    y0 + phoneH + 56,
  );

  fs.writeFileSync(path.join(OUT, "ux-compare-decision.png"), canvas.toBuffer("image/png"));
  console.log("wrote compare");

  // also paste real live screenshot next to proposed if available
  if (fs.existsSync(liveShot)) {
    try {
      const shot = await loadImage(liveShot);
      const sw = 520;
      const sh = Math.round((sw / shot.width) * shot.height);
      const cw2 = pad * 2 + sw + gap + phoneW;
      const ch2 = pad + 80 + Math.max(sh, phoneH) + 70;
      const c2 = createCanvas(cw2, ch2);
      const x = c2.getContext("2d");
      x.fillStyle = "#1a241c";
      x.fillRect(0, 0, cw2, ch2);
      x.fillStyle = "#e8d9c0";
      x.font = `600 14px ${sans}`;
      x.fillText("LIVE SCREENSHOT  vs  PROPOSED MOCK", pad, 36);
      x.fillStyle = "#f3efe6";
      x.font = `700 24px ${zh}`;
      x.fillText("真实线上截图 · 对照改版模拟", pad, 68);
      x.drawImage(shot, pad, 90, sw, sh);
      x.drawImage(right, pad + sw + gap, 90, phoneW, phoneH);
      x.fillStyle = "#c4a574";
      x.font = `600 13px ${zh}`;
      x.fillText("左：线上真实截图（海坨山 · 个人报告）", pad, 90 + Math.max(sh, phoneH) + 28);
      x.fillStyle = "#9ec5a6";
      x.fillText("右：改版模拟", pad + sw + gap, 90 + Math.max(sh, phoneH) + 28);
      fs.writeFileSync(
        path.join(OUT, "ux-compare-live-shot.png"),
        c2.toBuffer("image/png"),
      );
      console.log("wrote live-shot compare");
    } catch (e) {
      console.log("live shot compose skip", e.message);
    }
  }
}

renderLiveApprox();
renderProposed();
renderCompare().catch(console.error);
