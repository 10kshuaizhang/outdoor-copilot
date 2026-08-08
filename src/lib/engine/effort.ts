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
  const steepSpike = Math.max(0, input.maxGradePct - 12) * 0.04;
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

  if (
    input.avgGradePct >= 10 ||
    input.maxGradePct >= 22 ||
    (input.gainM >= input.lossM && effortDensity >= 2.4)
  ) {
    return "hard_climb";
  }

  if (
    input.avgGradePct <= 4 &&
    input.maxGradePct < 14 &&
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

/** Backfill effort fields for older saved analyses (Week 1 predictions). */
export function ensureSegmentEffort(segments: SegmentGeometry[]): Segment[] {
  return segments.map((seg, idx) => {
    if (
      typeof seg.estimatedEffort === "number" &&
      seg.effortLabel != null &&
      Number.isFinite(seg.estimatedEffort)
    ) {
      return seg as Segment;
    }
    return enrichSegmentEffort({
      idx: seg.idx ?? idx,
      startKm: seg.startKm ?? 0,
      endKm: seg.endKm ?? 0,
      distanceM: seg.distanceM ?? 0,
      gainM: seg.gainM ?? 0,
      lossM: seg.lossM ?? 0,
      avgGradePct: seg.avgGradePct ?? 0,
      maxGradePct: seg.maxGradePct ?? 0,
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

/**
 * Find the hardest contiguous stretch by merging adjacent high-effort
 * climbing segments around the peak-effort segment.
 */
export function findHardestStretch(segments: Segment[]): HardestStretch | null {
  if (segments.length === 0) return null;

  let peak = segments[0];
  for (const seg of segments) {
    if (seg.estimatedEffort > peak.estimatedEffort) peak = seg;
  }

  // Expand around peak while neighbors stay "hard" relative to median.
  const efforts = segments.map((s) => s.estimatedEffort).sort((a, b) => a - b);
  const median = efforts[Math.floor(efforts.length / 2)] ?? peak.estimatedEffort;
  const hardFloor = Math.max(median * 1.15, peak.estimatedEffort * 0.55);

  let from = peak.idx;
  let to = peak.idx;
  while (from > 0) {
    const prev = segments[from - 1];
    if (
      prev.estimatedEffort >= hardFloor &&
      prev.effortLabel !== "descent" &&
      prev.avgGradePct > 2
    ) {
      from -= 1;
    } else break;
  }
  while (to < segments.length - 1) {
    const next = segments[to + 1];
    if (
      next.estimatedEffort >= hardFloor &&
      next.effortLabel !== "descent" &&
      next.avgGradePct > 2
    ) {
      to += 1;
    } else break;
  }

  const slice = segments.slice(from, to + 1);
  const estimatedEffort = slice.reduce((s, x) => s + x.estimatedEffort, 0);
  const gainM = slice.reduce((s, x) => s + x.gainM, 0);
  const distanceM = slice.reduce((s, x) => s + x.distanceM, 0);
  const avgGradePct =
    distanceM > 0 ? ((gainM - slice.reduce((s, x) => s + x.lossM, 0)) / distanceM) * 100 : 0;

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
    peakSegment: peak,
  };
}

export function hardestStretchTemplate(stretch: HardestStretch): string {
  const span = `${stretch.startKm.toFixed(1)}–${stretch.endKm.toFixed(1)} km`;
  const label = effortLabelZh(stretch.label);
  return `真正难的是 ${span}（${label}）。该段累计爬升约 ${stretch.gainM} m，平均坡度约 ${stretch.avgGradePct}%，相对负荷 ${stretch.estimatedEffort}。把体力留给这一段，前后可匀速通过。`;
}
