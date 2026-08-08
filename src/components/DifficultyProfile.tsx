"use client";

import {
  ensureSegmentEffort,
  effortLabelZh,
  findHardestStretch,
  type Segment,
} from "@/lib/engine";

type Props = {
  segments: Segment[];
  className?: string;
};

function labelFill(label: Segment["effortLabel"]): string {
  switch (label) {
    case "hard_climb":
      return "var(--cta)";
    case "moderate":
      return "var(--pine)";
    case "easy":
      return "rgba(63,107,74,0.35)";
    case "descent":
      return "rgba(90,98,104,0.45)";
  }
}

export function DifficultyProfile({ segments, className }: Props) {
  const enriched = ensureSegmentEffort(segments);
  if (enriched.length === 0) {
    return (
      <p className={className ?? "text-sm text-[var(--rock)]"}>暂无分段数据</p>
    );
  }

  const width = 320;
  const height = 132;
  const padX = 10;
  const padY = 16;
  const chartH = height - padY * 2;
  const chartW = width - padX * 2;
  const endKm = enriched[enriched.length - 1].endKm || 1;
  const maxEffort = Math.max(...enriched.map((s) => s.estimatedEffort), 0.01);
  const hardest = findHardestStretch(enriched);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="路线难度剖面：公里轴上的相对负荷"
      >
        {hardest ? (
          <rect
            x={padX + (hardest.startKm / endKm) * chartW}
            y={padY - 4}
            width={Math.max(
              2,
              ((hardest.endKm - hardest.startKm) / endKm) * chartW,
            )}
            height={chartH + 8}
            fill="rgba(196, 92, 54, 0.12)"
          />
        ) : null}
        {enriched.map((seg) => {
          const x = padX + (seg.startKm / endKm) * chartW;
          const w = Math.max(
            1.2,
            ((seg.endKm - seg.startKm) / endKm) * chartW - 0.6,
          );
          const h = (seg.estimatedEffort / maxEffort) * chartH;
          const y = padY + chartH - h;
          return (
            <rect
              key={seg.idx}
              x={x}
              y={y}
              width={w}
              height={Math.max(1.5, h)}
              fill={labelFill(seg.effortLabel)}
              opacity={0.92}
            >
              <title>
                {seg.startKm.toFixed(1)}–{seg.endKm.toFixed(1)} km ·{" "}
                {effortLabelZh(seg.effortLabel)} · 负荷 {seg.estimatedEffort}
              </title>
            </rect>
          );
        })}
        <line
          x1={padX}
          y1={padY + chartH}
          x2={padX + chartW}
          y2={padY + chartH}
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="1"
        />
        <text
          x={padX}
          y={height - 2}
          fill="var(--rock)"
          fontSize="9"
          fontFamily="var(--font-serif-sc), serif"
        >
          0 km
        </text>
        <text
          x={padX + chartW}
          y={height - 2}
          fill="var(--rock)"
          fontSize="9"
          textAnchor="end"
          fontFamily="var(--font-serif-sc), serif"
        >
          {endKm.toFixed(1)} km
        </text>
      </svg>

      {hardest ? (
        <p className="mt-2 font-[family-name:var(--font-serif-sc)] text-sm text-[var(--pine-deep)]">
          真正难的是 {hardest.startKm.toFixed(1)}–{hardest.endKm.toFixed(1)} km
          <span className="text-[var(--rock)]">
            {" "}
            · {effortLabelZh(hardest.label)} · 爬升约 {hardest.gainM} m
          </span>
        </p>
      ) : null}

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--rock)]">
        {(
          [
            ["hard_climb", "陡升"],
            ["moderate", "适中"],
            ["easy", "轻松"],
            ["descent", "下坡"],
          ] as const
        ).map(([key, zh]) => (
          <li key={key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ background: labelFill(key) }}
              aria-hidden
            />
            {zh}
          </li>
        ))}
      </ul>
    </div>
  );
}
