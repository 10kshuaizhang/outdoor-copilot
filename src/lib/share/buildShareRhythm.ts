import {
  ensureSegmentEffort,
  findHardestStretch,
  type HardestStretch,
} from "@/lib/engine/effort";
import type {
  ElevationSample,
  RouteAnalysis,
  Segment,
} from "@/lib/engine/types";

export type ShareCardStyle = "airy" | "rich" | "balanced";

export const DEFAULT_SHARE_CARD_STYLE: ShareCardStyle = "airy";

export const SHARE_CARD_STYLE_OPTIONS: Array<{
  id: ShareCardStyle;
  label: string;
  hint: string;
}> = [
  { id: "airy", label: "美感", hint: "大分数 + 海拔剖面" },
  { id: "balanced", label: "节奏", hint: "分数 + 三段节奏卡" },
  { id: "rich", label: "干货", hint: "分数 + 全程分段明细" },
];

export type RhythmPhase = {
  startKm: number;
  endKm: number;
  /** Chip label e.g. 适中 / 困难 */
  feel: string;
  line1: string;
  line2: string;
  tone: string;
  /** Relative effort bar 0–1 for rich style */
  bar: number;
  peak?: boolean;
};

function elevAtKm(
  profile: ElevationSample[],
  km: number,
): number | null {
  if (!profile.length) return null;
  let best = profile[0]!;
  let bestD = Math.abs(best.km - km);
  for (const s of profile) {
    const d = Math.abs(s.km - km);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return Math.round(best.ele);
}

function sliceSegs(
  segments: Segment[],
  startKm: number,
  endKm: number,
): Segment[] {
  return segments.filter(
    (s) => s.endKm > startKm + 0.02 && s.startKm < endKm - 0.02,
  );
}

function summarizeSlice(
  segs: Segment[],
  startKm: number,
  endKm: number,
  profile: ElevationSample[],
  peak: boolean,
): RhythmPhase {
  const gain = Math.round(segs.reduce((s, x) => s + x.gainM, 0));
  const loss = Math.round(segs.reduce((s, x) => s + x.lossM, 0));
  const effort = segs.reduce((s, x) => s + x.estimatedEffort, 0);
  const e0 = elevAtKm(profile, startKm);
  const e1 = elevAtKm(profile, endKm);

  let feel = "适中";
  let tone = "#3f6b4a";
  let line1 = "起伏缓和";

  if (peak) {
    feel = "困难";
    tone = "#8b6914";
    line1 = "连续爬升";
  } else if (loss > gain * 1.25 && loss >= 120) {
    feel = "控速";
    tone = "#5a6268";
    line1 = "长下坡为主";
  } else if (gain >= 180 || segs.some((s) => s.effortLabel === "hard_climb")) {
    feel = "偏难";
    tone = "#6b7a3a";
    line1 = "爬升偏多";
  } else if (gain < 80 && loss < 100) {
    feel = "轻松";
    tone = "#5a7a62";
    line1 = "转平缓和";
  }

  const line2 =
    e0 != null && e1 != null
      ? `海拔约 ${e0}→${e1}`
      : gain >= loss
        ? `爬升约 +${gain} m`
        : `下降约 ${loss} m`;

  const bar = Math.min(1, Math.max(0.18, effort / Math.max(4, segs.length * 2.2)));

  return {
    startKm: Number(startKm.toFixed(1)),
    endKm: Number(endKm.toFixed(1)),
    feel,
    line1,
    line2,
    tone,
    bar: peak ? 1 : bar,
    peak,
  };
}

/**
 * Build 3–4 rhythm phases for share cards from geometry + hardest stretch.
 */
export function buildShareRhythm(
  analysis: RouteAnalysis,
  mode: "balanced" | "rich" = "balanced",
): RhythmPhase[] {
  const segments = ensureSegmentEffort(analysis.segments);
  if (segments.length === 0) return [];

  const endKm = segments[segments.length - 1]!.endKm;
  const profile = analysis.elevationProfile ?? [];
  const hardest = findHardestStretch(segments);

  if (!hardest || hardest.endKm - hardest.startKm < 0.15) {
    return thirdsFallback(segments, endKm, profile, mode);
  }

  const h0 = hardest.startKm;
  const h1 = hardest.endKm;
  const phases: RhythmPhase[] = [];

  if (h0 > 0.3) {
    phases.push(
      summarizeSlice(sliceSegs(segments, 0, h0), 0, h0, profile, false),
    );
  }

  phases.push(
    summarizeSlice(sliceSegs(segments, h0, h1), h0, h1, profile, true),
  );

  if (endKm - h1 > 0.4) {
    if (mode === "rich" && endKm - h1 > 3) {
      const mid = h1 + (endKm - h1) * 0.45;
      phases.push(
        summarizeSlice(sliceSegs(segments, h1, mid), h1, mid, profile, false),
      );
      const late = summarizeSlice(
        sliceSegs(segments, mid, endKm),
        mid,
        endKm,
        profile,
        false,
      );
      // Prefer “后段可松 / 控速” wording on the last card for share copy.
      if (late.feel === "轻松" || late.feel === "适中") {
        late.feel = late.line1.includes("下坡") ? "控速" : "后段可松";
        if (late.feel === "后段可松") late.tone = "#5a7a62";
      }
      phases.push(late);
    } else {
      const late = summarizeSlice(
        sliceSegs(segments, h1, endKm),
        h1,
        endKm,
        profile,
        false,
      );
      if (late.line1.includes("下坡") || late.feel === "控速") {
        late.feel = "后段可松";
        late.tone = "#5a7a62";
        if (!late.line1.includes("下坡")) late.line1 = "转平后长下坡";
      } else {
        late.feel = "后段可松";
        late.tone = "#5a7a62";
      }
      phases.push(late);
    }
  }

  return phases.slice(0, mode === "rich" ? 4 : 3);
}

function thirdsFallback(
  segments: Segment[],
  endKm: number,
  profile: ElevationSample[],
  mode: "balanced" | "rich",
): RhythmPhase[] {
  const cuts =
    mode === "rich"
      ? [0, endKm * 0.25, endKm * 0.5, endKm * 0.75, endKm]
      : [0, endKm / 3, (endKm * 2) / 3, endKm];
  const phases: RhythmPhase[] = [];
  let peakIdx = 0;
  let peakEffort = -1;
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i]!;
    const b = cuts[i + 1]!;
    const segs = sliceSegs(segments, a, b);
    const effort = segs.reduce((s, x) => s + x.estimatedEffort, 0);
    if (effort > peakEffort) {
      peakEffort = effort;
      peakIdx = i;
    }
  }
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i]!;
    const b = cuts[i + 1]!;
    phases.push(
      summarizeSlice(
        sliceSegs(segments, a, b),
        a,
        b,
        profile,
        i === peakIdx,
      ),
    );
  }
  return phases;
}

export function shareRiskLine(
  analysis: RouteAnalysis,
  hardest: HardestStretch | null,
): string {
  if (hardest) {
    return `主风险：${hardest.startKm.toFixed(1)}–${hardest.endKm.toFixed(1)} km 连续爬升约 +${hardest.gainM} m。过了此后段可放松走，下坡控速防滑。`;
  }
  if (analysis.recommendation.mainRisk) {
    return `主风险：${analysis.recommendation.mainRisk}。预留体力，下坡控速防滑。`;
  }
  return "预留体力给爬升段；下坡控速防滑。Know the trail.";
}

/** Compact duration for share cards, e.g. `5–6.5 h` or `40–55 分钟`. */
export function formatShareDuration(lowMin: number, highMin: number): string {
  const fmtH = (min: number) => {
    const h = min / 60;
    if (h < 1) return `${Math.round(min)}分`;
    const rounded = Math.round(h * 2) / 2;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };
  const loH = lowMin / 60;
  const hiH = highMin / 60;
  if (loH < 1 && hiH < 1) {
    return `${Math.round(lowMin)}–${Math.round(highMin)} 分钟`;
  }
  return `${fmtH(lowMin)}–${fmtH(highMin)} h`;
}
