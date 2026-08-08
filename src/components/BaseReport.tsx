import { ElevationProfile } from "@/components/ElevationProfile";
import type { RouteAnalysis } from "@/lib/engine";

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} 分钟`;
  return `${h} 小时 ${m} 分钟`;
}

type Props = {
  analysis: RouteAnalysis;
  title?: string;
};

export function BaseReport({ analysis, title }: Props) {
  const { route, baseDifficulty, duration, band } = analysis;

  return (
    <article className="space-y-8">
      {title ? (
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
          {title}
        </h2>
      ) : null}

      <div>
        <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.14em] text-[var(--pine)]">
          路线基础负荷
        </p>
        <div className="mt-2 flex items-end gap-3">
          <p className="font-[family-name:var(--font-display)] text-6xl leading-none tracking-[-0.04em]">
            {baseDifficulty.overall}
          </p>
          <div className="pb-1">
            <p className="text-sm text-[var(--rock)]">/ 100</p>
            <p className="font-[family-name:var(--font-serif-sc)] text-xl text-[var(--pine-deep)]">
              {band}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-[var(--rock)]">距离</dt>
          <dd className="mt-1 text-lg font-semibold">
            {route.distanceKm.toFixed(1)} km
          </dd>
        </div>
        <div>
          <dt className="text-[var(--rock)]">爬升</dt>
          <dd className="mt-1 text-lg font-semibold">+{route.elevationGainM} m</dd>
        </div>
        <div>
          <dt className="text-[var(--rock)]">预估时长</dt>
          <dd className="mt-1 text-lg font-semibold">
            {formatDuration(duration.lowMin)} – {formatDuration(duration.highMin)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--rock)]">最高海拔</dt>
          <dd className="mt-1 text-lg font-semibold">{route.maxElevM} m</dd>
        </div>
      </dl>

      <div>
        <p className="mb-2 text-sm text-[var(--rock)]">海拔剖面</p>
        <ElevationProfile samples={analysis.elevationProfile} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {(
          [
            ["耐力", baseDifficulty.endurance],
            ["攀爬", baseDifficulty.climbing],
            ["天气", baseDifficulty.weather],
            ["风险", baseDifficulty.risk],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="border-t border-black/10 pt-2">
            <p className="text-[var(--rock)]">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
        {analysis.explanation.text}
      </p>

      <p className="border-t border-black/10 pt-4 text-xs leading-relaxed text-[var(--rock)]">
        本工具仅提供辅助判断，不能替代你的经验、向导建议或现场决策。分数表示路线基础负荷，不是对你个人的最终难度。
      </p>
    </article>
  );
}
