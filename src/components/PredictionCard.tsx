"use client";

import { LabelWithTip } from "@/components/InfoTip";
import { TIPS } from "@/components/tipCopy";
import { scoreBand, type RouteAnalysis } from "@/lib/engine";

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} 分钟`;
  return `${h} 小时 ${m} 分钟`;
}

function confidenceLabel(c: number): string {
  if (c >= 0.75) return "高";
  if (c >= 0.55) return "中";
  return "低";
}

type Props = {
  analysis: RouteAnalysis;
  saved?: boolean;
  saving?: boolean;
  onSave?: () => void;
  onMarkHiking?: () => void;
};

/**
 * Week-1 "Your Prediction" surface — numbers from deterministic engine only.
 */
export function PredictionCard({
  analysis,
  saved,
  saving,
  onSave,
  onMarkHiking,
}: Props) {
  const personal = analysis.personalDifficulty.overall;
  const band = scoreBand(personal);
  const { duration } = analysis;

  return (
    <section className="panel space-y-5 px-5 py-6">
      <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.16em] text-[var(--pine)]">
        这次预测
      </p>

      <div>
        <p className="text-sm text-[var(--rock)]">
          <LabelWithTip tip={TIPS.scoreHeroPersonal} tipLabel="个人难度说明">
            个人难度
          </LabelWithTip>
        </p>
        <div className="mt-1 flex items-end gap-4">
          <p className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.03em] text-[var(--pine-deep)]">
            {personal}
          </p>
          <div className="flex flex-col justify-end gap-1 pb-1">
            <p className="text-sm leading-none text-[var(--rock)]">/ 100</p>
            <p className="font-[family-name:var(--font-serif-sc)] text-xl leading-tight text-[var(--cta)]">
              <LabelWithTip tip={TIPS.scoreBand} tipLabel="难度档位说明">
                {band}
              </LabelWithTip>
            </p>
          </div>
        </div>
        {analysis.hikeBrief ? (
          <p className="mt-2 text-sm font-semibold text-[var(--pine-deep)]">
            <LabelWithTip tip={TIPS.briefVerdict} tipLabel="宜行结论说明">
              {analysis.hikeBrief.verdictLabel}
            </LabelWithTip>
            <span className="ml-2 font-normal text-[var(--rock)]">
              · {analysis.hikeBrief.headline}
            </span>
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[var(--rock)]">
            <LabelWithTip tip={TIPS.durationMoving} tipLabel="预估时长说明">
              预估时长
            </LabelWithTip>
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatDuration(duration.lowMin)} – {formatDuration(duration.highMin)}
          </p>
        </div>
        <div>
          <p className="text-[var(--rock)]">
            <LabelWithTip tip={TIPS.confidence} tipLabel="置信度说明">
              置信度
            </LabelWithTip>
          </p>
          <p className="mt-1 text-lg font-semibold">
            {confidenceLabel(analysis.confidence)}
            <span className="ml-1 text-sm font-normal text-[var(--rock)]">
              ({Math.round(analysis.confidence * 100)}%)
            </span>
          </p>
        </div>
      </div>

      {onSave ? (
        <button
          type="button"
          disabled={saving || saved}
          onClick={onSave}
          className="btn-primary min-h-12 w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saved
            ? "已保存这次预测"
            : saving
              ? "保存中…"
              : "保存这次预测"}
        </button>
      ) : null}

      <div className="space-y-2 border-t border-[var(--border-soft)] pt-4">
        <button
          type="button"
          disabled={!saved}
          onClick={onMarkHiking}
          className="btn-ghost min-h-12 w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          我要去走这条线
        </button>
        <p className="text-xs leading-relaxed text-[var(--rock)]">
          走完后可回来对比预测与实际。请先保存预测。
        </p>
      </div>
    </section>
  );
}
