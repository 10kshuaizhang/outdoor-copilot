import type { ElevationSample } from "@/lib/engine";

type Props = {
  samples: ElevationSample[];
  className?: string;
};

export function ElevationProfile({ samples, className }: Props) {
  if (samples.length < 2) {
    return (
      <p className={className ?? "text-sm text-[var(--rock)]"}>暂无海拔数据</p>
    );
  }

  const width = 320;
  const height = 120;
  const padX = 8;
  const padY = 10;
  const minEle = Math.min(...samples.map((s) => s.ele));
  const maxEle = Math.max(...samples.map((s) => s.ele));
  const maxKm = samples[samples.length - 1].km || 1;
  const span = Math.max(1, maxEle - minEle);

  const coords = samples.map((s) => {
    const x = padX + (s.km / maxKm) * (width - padX * 2);
    const y =
      height - padY - ((s.ele - minEle) / span) * (height - padY * 2);
    return `${x},${y}`;
  });

  const area = `${padX},${height - padY} ${coords.join(" ")} ${width - padX},${height - padY}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className ?? "h-auto w-full"}
      role="img"
      aria-label="海拔剖面"
    >
      <polygon points={area} fill="rgba(63,107,74,0.18)" />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="var(--pine-deep)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
