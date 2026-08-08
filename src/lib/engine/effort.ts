import { clampGradePct } from "./grade";
import type { EffortLabel, Segment } from "./types";

/**
 * Geometry-only effort for Route Intelligence (Week 2).
 * Does NOT feed overall difficulty / duration formulas.
 *
 * Units are relative "effort points" for profiling:
 * distance × grade load + climb contribution + steep spike.
 */
export function estimateSegmentEffort(input: {
  distanceM: number;
  gainM: number;
  lossM: number;
  avgGradePct: number;
  maxGradePct: number;
}): number {
  const distanceKm = Math.max(0, input.distanceM) / 1000;
  const climbLoad = Math.max(0, input.avgGradePct) / 10;
  const cappedMax = clampGradePct(input.maxGradePct);
  // Cap steep contribution so one GPS spike cannot dominate the profile.
  const steepSpike = Math.min(1.2, Math.max(0, cappedMax - 12) * 0.04);
  const ascent = Math.max(0, input.gainM) / 100;
  const raw = distanceKm * (1 + climbLoad + steepSpike) + ascent;
  return Math.round(raw * 100) / 100;
}

export function labelSegmentEffort(input: {
  distanceM: number;
  gainM: number;
  lossM: number;
  avgGradePct: number;
  maxGradePct: number;
  estimatedEffort: number;
}): EffortLabel {
  const distanceKm = Math.max(1e-6, input.distanceM / 1000);
  const effortDensity = input.estimatedEffort / distanceKm;
  const netDescent =
    input.lossM > input.gainM * 1.35 && input.avgGradePct <= -2;

  if (netDescent || input.avgGradePct <= -3) {
    return "descent";
  }

  const cappedMax = clampGradePct(input.maxGradePct);

  if (
    input.avgGradePct >= 10 ||
    cappedMax >= 22 ||
    (input.gainM >= input.lossM && effortDensity >= 2.4)
  ) {
    return "hard_climb";
  }

  if (
    input.avgGradePct <= 4 &&
    cappedMax < 14 &&
    effortDensity < 1.55
  ) {
    return "easy";
  }

  return "moderate";
}

export function enrichSegmentEffort<T extends Omit<Segment, "estimatedEffort" | "effortLabel">>(
  seg: T,
): T & Pick<Segment, "estimatedEffort" | "effortLabel"> {
  const estimatedEffort = estimateSegmentEffort(seg);
  const effortLabel = labelSegmentEffort({ ...seg, estimatedEffort });
  return { ...seg, estimatedEffort, effortLabel };
}

type SegmentGeometry = {
  idx?: number;
  startKm?: number;
  endKm?: number;
  distanceM?: number;
  gainM?: number;
  lossM?: number;
  avgGradePct?: number;
  maxGradePct?: number;
  estimatedEffort?: number;
  effortLabel?: Segment["effortLabel"];
};

/** Backfill / sanitize effort fields (also reclamps absurd GPS max grades). */
export function ensureSegmentEffort(segments: SegmentGeometry[]): Segment[] {
  return segments.map((seg, idx) => {
    const maxGradePct = clampGradePct(seg.maxGradePct ?? 0);
    const needsRefresh =
      typeof seg.estimatedEffort !== "number" ||
      seg.effortLabel == null ||
      !Number.isFinite(seg.estimatedEffort) ||
      (seg.maxGradePct ?? 0) > maxGradePct + 0.01;

    if (!needsRefresh) {
      return { ...(seg as Segment), maxGradePct };
    }
    return enrichSegmentEffort({
      idx: seg.idx ?? idx,
      startKm: seg.startKm ?? 0,
      endKm: seg.endKm ?? 0,
      distanceM: seg.distanceM ?? 0,
      gainM: seg.gainM ?? 0,
      lossM: seg.lossM ?? 0,
      avgGradePct: seg.avgGradePct ?? 0,
      maxGradePct,
    });
  });
}

/** Chinese display for effort labels. */
export function effortLabelZh(label: EffortLabel): string {
  switch (label) {
    case "easy":
      return "轻松";
    case "hard_climb":
      return "陡升";
    case "moderate":
      return "适中";
    case "descent":
      return "下坡";
  }
}

export type HardestStretch = {
  startKm: number;
  endKm: number;
  estimatedEffort: number;
  peakEffort: number;
  avgGradePct: number;
  gainM: number;
  label: EffortLabel;
  /** Segment indices included (inclusive). */
  fromIdx: number;
  toIdx: number;
  /** Peak-effort segment (for LLM explain). */
  peakSegment: Segment;
};

function isClimbish(seg: Segment): boolean {
  return (
    seg.effortLabel === "hard_climb" ||
    seg.avgGradePct > 2 ||
    seg.gainM >= Math.max(20, seg.lossM * 0.85)
  );
}

/** Climb-first hardness — pure descents with GPS spikes must not win. */
export function segmentHardScore(seg: Segment): number {
  const cappedMax = clampGradePct(seg.maxGradePct);
  if (!isClimbish(seg)) {
    return Math.min(seg.estimatedEffort, 1.2) * 0.25 + seg.lossM / 500;
  }
  return seg.estimatedEffort + seg.gainM / 60 + Math.max(0, seg.avgGradePct) / 25 + cappedMax / 80;
}

/**
 * Find the hardest contiguous stretch by merging adjacent high-effort
 * climbing segments around the peak hard-score segment.
 */
export function findHardestStretch(segments: Segment[]): HardestStretch | null {
  if (segments.length === 0) return null;

  const ranked = ensureSegmentEffort(segments);
  const climbPool = ranked.filter(isClimbish);
  const pool = climbPool.length > 0 ? climbPool : ranked;

  let peak = pool[0];
  let peakScore = segmentHardScore(peak);
  for (const seg of pool) {
    const score = segmentHardScore(seg);
    if (score > peakScore) {
      peak = seg;
      peakScore = score;
    }
  }

  // Expand around peak while neighbors stay "hard" relative to median.
  const scores = ranked.map(segmentHardScore).sort((a, b) => a - b);
  const median = scores[Math.floor(scores.length / 2)] ?? peakScore;
  const hardFloor = Math.max(median * 1.15, peakScore * 0.55);

  let from = peak.idx;
  let to = peak.idx;
  while (from > 0) {
    const prev = ranked[from - 1];
    if (
      segmentHardScore(prev) >= hardFloor &&
      prev.effortLabel !== "descent" &&
      prev.avgGradePct > 2
    ) {
      from -= 1;
    } else break;
  }
  while (to < ranked.length - 1) {
    const next = ranked[to + 1];
    if (
      segmentHardScore(next) >= hardFloor &&
      next.effortLabel !== "descent" &&
      next.avgGradePct > 2
    ) {
      to += 1;
    } else break;
  }

  const slice = ranked.slice(from, to + 1);
  const estimatedEffort = slice.reduce((s, x) => s + x.estimatedEffort, 0);
  const gainM = slice.reduce((s, x) => s + x.gainM, 0);
  const lossM = slice.reduce((s, x) => s + x.lossM, 0);
  const distanceM = slice.reduce((s, x) => s + x.distanceM, 0);
  const avgGradePct =
    distanceM > 0 ? ((gainM - lossM) / distanceM) * 100 : 0;
  const peakSegment: Segment = {
    ...peak,
    maxGradePct: clampGradePct(peak.maxGradePct),
  };

  return {
    startKm: Number(slice[0].startKm.toFixed(2)),
    endKm: Number(slice[slice.length - 1].endKm.toFixed(2)),
    estimatedEffort: Math.round(estimatedEffort * 100) / 100,
    peakEffort: peak.estimatedEffort,
    avgGradePct: Math.round(avgGradePct * 10) / 10,
    gainM: Math.round(gainM),
    label: peak.effortLabel,
    fromIdx: from,
    toIdx: to,
    peakSegment,
  };
}

export function hardestStretchTemplate(stretch: HardestStretch): string {
  const span = `${stretch.startKm.toFixed(1)}–${stretch.endKm.toFixed(1)} km`;
  const label = effortLabelZh(stretch.label);
  const maxGrade = clampGradePct(stretch.peakSegment.maxGradePct);
  return `真正难的是 ${span}（${label}）。该段累计爬升约 ${stretch.gainM} m，平均坡度约 ${stretch.avgGradePct}%，峰值坡度约 ${maxGrade.toFixed(0)}%，相对负荷 ${stretch.estimatedEffort}。把体力留给这一段，前后可匀速通过。`;
}
