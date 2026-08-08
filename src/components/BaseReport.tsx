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
  mode?: "base" | "personal";
  onPersonalize?: () => void;
};

export function BaseReport({
  analysis,
  title,
  mode = "base",
  onPersonalize,
}: Props) {
  const { route, baseDifficulty, personalDifficulty, duration, band } = analysis;
  const showPersonal = mode === "personal";
  const focus = showPersonal ? personalDifficulty : baseDifficulty;

  return (
    <article className="space-y-8">
      {title ? (
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
          {title}
        </h2>
      ) : null}

      <div>
        <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.14em] text-[var(--pine)]">
          {showPersonal ? "对你的吃力程度" : "路线基础负荷"}
        </p>
        <div className="mt-2 flex items-end gap-3">
          <p className="font-[family-name:var(--font-display)] text-6xl leading-none tracking-[-0.04em]">
            {focus.overall}
          </p>
          <div className="pb-1">
            <p className="text-sm text-[var(--rock)]">/ 100</p>
            <p className="font-[family-name:var(--font-serif-sc)] text-xl text-[var(--pine-deep)]">
              {band}
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm text-[var(--rock)]">
          置信度 {Math.round(analysis.confidence * 100)}%
        </p>
      </div>

      {showPersonal ? (
        <div className="grid grid-cols-2 gap-4 border-y border-black/10 py-4">
          <div>
            <p className="text-sm text-[var(--rock)]">路线基础</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl">
              {baseDifficulty.overall}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--rock)]">对你而言</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--pine-deep)]">
              {personalDifficulty.overall}
            </p>
          </div>
        </div>
      ) : null}

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
            ["耐力", focus.endurance],
            ["攀爬", focus.climbing],
            ["天气", focus.weather],
            ["风险", focus.risk],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="border-t border-black/10 pt-2">
            <p className="text-[var(--rock)]">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {showPersonal && analysis.contributions.length > 0 ? (
        <div>
          <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
            为什么是这个分数
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {analysis.contributions.map((c) => (
              <li
                key={`${c.code}-${c.label}`}
                className="flex items-baseline justify-between gap-3 border-b border-black/5 pb-2"
              >
                <span>{c.label}</span>
                <span className="font-semibold tabular-nums">
                  {c.delta > 0 ? `+${c.delta}` : c.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
        {analysis.explanation.text}
      </p>

      {!showPersonal && onPersonalize ? (
        <button
          type="button"
          onClick={onPersonalize}
          className="w-full bg-[var(--cta)] px-5 py-3.5 text-sm font-semibold text-[var(--cta-ink)]"
        >
          告诉我你的水平，算出对你的难度
        </button>
      ) : null}

      <p className="border-t border-black/10 pt-4 text-xs leading-relaxed text-[var(--rock)]">
        本工具仅提供辅助判断，不能替代你的经验、向导建议或现场决策。
        {showPersonal
          ? " 分数表示对你的吃力程度，不是路线的绝对标签。"
          : " 当前为基础负荷；完善档案后可得到个人难度。"}
      </p>
    </article>
  );
}
