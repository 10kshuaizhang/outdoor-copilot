"use client";

import { useState } from "react";
import { DifficultyProfile } from "@/components/DifficultyProfile";
import { ElevationProfile } from "@/components/ElevationProfile";
import { ExplanationBody } from "@/components/ExplanationBody";
import { HardestSegmentNote } from "@/components/HardestSegmentNote";
import { RouteBriefCard } from "@/components/RouteBriefCard";
import { trackEvent } from "@/lib/analytics/events";
import { scoreBand, type RouteAnalysis } from "@/lib/engine";
import { formatShanghaiClock, shanghaiWallIso } from "@/lib/time/china";
import {
  downloadShareCard,
  generateShareCard,
  shareOrDownloadCard,
} from "@/lib/share/exportShareCard";
import { exportSummaryText } from "@/lib/share/exportSummary";

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} 分钟`;
  return `${h} 小时 ${m} 分钟`;
}

function formatClock(iso?: string): string {
  return formatShanghaiClock(iso);
}

type Props = {
  analysis: RouteAnalysis;
  title?: string;
  mode?: "base" | "personal";
  onPersonalize?: () => void;
  onStartChange?: (iso: string) => void;
  analysisId?: string;
  onFeedbackSaved?: () => void;
};

export function BaseReport({
  analysis,
  title,
  mode = "base",
  onPersonalize,
  onStartChange,
  analysisId,
  onFeedbackSaved,
}: Props) {
  const { route, baseDifficulty, personalDifficulty, duration } = analysis;
  const showPersonal = mode === "personal";
  const focus = showPersonal ? personalDifficulty : baseDifficulty;
  const band = scoreBand(focus.overall);
  const [actualMin, setActualMin] = useState("");
  const [perceived, setPerceived] = useState("3");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [showManualCopy, setShowManualCopy] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);
  const [cardCaption, setCardCaption] = useState<string | null>(null);

  const summaryText = [
    `Outdoor Copilot · ${title ?? "路线分析"}`,
    `个人难度 ${personalDifficulty.overall}/100（${band}）· 基础 ${baseDifficulty.overall}`,
    `距离 ${route.distanceKm.toFixed(1)} km · 爬升 +${route.elevationGainM} m`,
    `预估 ${formatDuration(duration.lowMin)} – ${formatDuration(duration.highMin)}`,
    analysis.recommendation.suggestedStart
      ? `建议出发 ${formatClock(analysis.recommendation.suggestedStart)} · 完成 ${analysis.recommendation.finishWindow}`
      : "",
    analysis.recommendation.mainRisk
      ? `主风险：${analysis.recommendation.mainRisk}`
      : "",
    "Know the trail. Know yourself. Go smarter.",
  ]
    .filter(Boolean)
    .join("\n");

  const ensureCard = async () => {
    const { blob, caption } = await generateShareCard({
      analysis,
      title,
    });
    setCardCaption(caption);
    setCardPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    return { caption };
  };

  const makeShareCard = async () => {
    setShareStatus(null);
    setShowManualCopy(false);
    setCardBusy(true);
    try {
      await ensureCard();
      const result = await shareOrDownloadCard({ analysis, title });
      if (result.ok) {
        trackEvent("share_image", { method: result.method });
        setCardCaption(result.caption);
        setShareStatus(
          result.method === "share"
            ? "已打开系统分享（可直接发小红书/保存到相册）。"
            : "图片已下载。打开小红书发图，再点「复制文案」。",
        );
        return;
      }
      setShareStatus(result.message);
      if (result.caption) setCardCaption(result.caption);
    } finally {
      setCardBusy(false);
    }
  };

  const saveCardOnly = async () => {
    setCardBusy(true);
    setShareStatus(null);
    try {
      await ensureCard();
      const result = await downloadShareCard({ analysis, title });
      if (result.ok) {
        trackEvent("share_image", { method: "download" });
        setShareStatus("图片已保存。发小红书时配上下方文案。");
      } else {
        setShareStatus(result.message);
      }
    } finally {
      setCardBusy(false);
    }
  };

  const copyCaption = async () => {
    let caption = cardCaption;
    if (!caption) {
      try {
        caption = (await ensureCard()).caption;
      } catch {
        caption = summaryText;
      }
    }
    const result = await exportSummaryText(caption);
    if (result.ok) {
      trackEvent("copy_share", { method: result.method });
      setShareStatus(
        result.method === "share"
          ? "已打开系统分享文案。"
          : "小红书文案已复制，粘贴到配文即可。",
      );
      return;
    }
    setShareStatus(result.message);
    setShowManualCopy(true);
  };

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
          {analysis.weather.source === "fallback"
            ? " · 天气为假设值"
            : " · 天气来自 Open-Meteo"}
          {analysis.weather.temperatureC != null
            ? ` · ${Math.round(analysis.weather.temperatureC)}°C`
            : ""}
        </p>
      </div>

      {analysis.hikeBrief ? (
        <RouteBriefCard brief={analysis.hikeBrief} />
      ) : null}

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
          <dt className="text-[var(--rock)]">预估时长（行进向）</dt>
          <dd className="mt-1 text-lg font-semibold">
            {formatDuration(duration.lowMin)} – {formatDuration(duration.highMin)}
          </dd>
          <dd className="mt-1 text-xs text-[var(--rock)]">
            不含长时间观景 / 用餐；休闲走会更久
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

      <div>
        <p className="mb-1 font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
          难度剖面
        </p>
        <p className="mb-2 text-sm text-[var(--rock)]">
          公里轴上的相对负荷——不是总分，而是哪里真正吃力
        </p>
        <DifficultyProfile segments={analysis.segments} />
      </div>

      <HardestSegmentNote segments={analysis.segments} enableLlm />

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

      {showPersonal && analysis.challenges.length > 0 ? (
        <div>
          <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
            主要挑战
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            {analysis.challenges.map((c) => (
              <li key={`${c.kind}-${c.startKm}`}>{c.title}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {showPersonal ? (
        <div className="space-y-3 border-t border-black/10 pt-5 text-sm">
          <p className="font-[family-name:var(--font-serif-sc)] tracking-[0.12em] text-[var(--pine)]">
            行动建议
          </p>
          <p>
            建议出发：{formatClock(analysis.recommendation.suggestedStart)}
          </p>
          <p>预计完成：{analysis.recommendation.finishWindow ?? "—"}</p>
          <p>建议饮水：{analysis.recommendation.waterLiters ?? "—"} L</p>
          <p>主风险：{analysis.recommendation.mainRisk ?? "—"}</p>
          {analysis.recommendation.paceNote ? (
            <p className="text-[var(--ink-soft)]">
              {analysis.recommendation.paceNote}
            </p>
          ) : null}
          {onStartChange ? (
            <label className="block pt-2 text-[var(--rock)]">
              改出发时刻（what-if）
              <input
                type="time"
                className="mt-1 block w-full border border-black/15 bg-white px-3 py-2 text-[var(--ink)]"
                value={
                  analysis.recommendation.suggestedStart
                    ? formatClock(analysis.recommendation.suggestedStart)
                    : "07:30"
                }
                onChange={(e) => {
                  const [hh, mm] = e.target.value.split(":").map(Number);
                  const day =
                    analysis.weather.date ??
                    new Date().toLocaleDateString("en-CA", {
                      timeZone: "Asia/Shanghai",
                    });
                  onStartChange(shanghaiWallIso(day, hh || 0, mm || 0));
                }}
              />
            </label>
          ) : null}
          {analysis.physiological ? (
            <p className="pt-2 text-xs text-[var(--rock)]">
              估算生理强度等级（参考学术模型）：
              {analysis.physiological.gradeLabel}
              {analysis.physiological.usedDefaults ? " · 使用默认生理参数" : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="mb-2 font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
          简报原文
        </p>
        <ExplanationBody text={analysis.explanation.text} />
        {showPersonal ? (
          <p className="mt-2 text-xs text-[var(--rock)]">
            {analysis.explanation.source === "llm"
              ? analysis.explanation.model ?? "LLM"
              : "结构化模板"}
          </p>
        ) : null}
      </div>

      {!showPersonal && onPersonalize ? (
        <button
          type="button"
          onClick={onPersonalize}
          className="w-full bg-[var(--cta)] px-5 py-3.5 text-sm font-semibold text-[var(--cta-ink)]"
        >
          告诉我你的水平，算出对你的难度
        </button>
      ) : null}

      {showPersonal ? (
        <>
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.12em] text-[var(--pine)]">
              分享到小红书
            </p>
            <p className="text-sm text-[var(--rock)]">
              生成 3:4 海报图（不是纯文字）。保存后发笔记，再复制配文。
            </p>
            <button
              type="button"
              disabled={cardBusy}
              onClick={() => void makeShareCard()}
              className="w-full bg-[var(--pine-deep)] px-5 py-3.5 text-sm font-semibold text-[var(--cream)] disabled:opacity-60"
            >
              {cardBusy ? "生成中…" : "生成小红书分享图"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={cardBusy}
                onClick={() => void saveCardOnly()}
                className="border border-[var(--pine-deep)] px-3 py-2.5 text-sm font-semibold text-[var(--pine-deep)] disabled:opacity-60"
              >
                仅保存图片
              </button>
              <button
                type="button"
                disabled={cardBusy}
                onClick={() => void copyCaption()}
                className="border border-[var(--pine-deep)] px-3 py-2.5 text-sm font-semibold text-[var(--pine-deep)] disabled:opacity-60"
              >
                复制文案
              </button>
            </div>
            {cardPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cardPreviewUrl}
                alt="小红书分享预览"
                className="mx-auto w-full max-w-xs border border-black/10"
              />
            ) : null}
            {cardCaption ? (
              <textarea
                readOnly
                value={cardCaption}
                className="min-h-28 w-full border border-black/15 bg-white p-3 text-sm text-[var(--ink)]"
                onFocus={(e) => e.currentTarget.select()}
              />
            ) : null}
            {shareStatus ? (
              <p className="text-sm text-[var(--pine-deep)]" role="status">
                {shareStatus}
              </p>
            ) : null}
            {showManualCopy ? (
              <textarea
                readOnly
                value={cardCaption ?? summaryText}
                className="min-h-32 w-full border border-black/15 bg-white p-3 text-sm text-[var(--ink)]"
                onFocus={(e) => e.currentTarget.select()}
              />
            ) : null}
          </div>
          <div className="space-y-3 border-t border-black/10 pt-5 text-sm">
            <p className="font-[family-name:var(--font-serif-sc)] tracking-[0.12em] text-[var(--pine)]">
              走完后回填（不自动改模型）
            </p>
            <label className="block text-[var(--rock)]">
              实际总用时（分钟）
              <input
                type="number"
                value={actualMin}
                onChange={(e) => setActualMin(e.target.value)}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2 text-[var(--ink)]"
              />
            </label>
            <label className="block text-[var(--rock)]">
              主观难度 1–5
              <input
                type="number"
                min={1}
                max={5}
                value={perceived}
                onChange={(e) => setPerceived(e.target.value)}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2 text-[var(--ink)]"
              />
            </label>
            <button
              type="button"
              className="bg-[var(--pine-deep)] px-4 py-2.5 text-[var(--cream)]"
              onClick={async () => {
                trackEvent("feedback", {
                  actualMin: Number(actualMin) || 0,
                  perceived: Number(perceived) || 0,
                });
                if (analysisId) {
                  const { saveFeedback } = await import("@/lib/history/storage");
                  const result = saveFeedback({
                    analysisId,
                    actualTotalMin: Number(actualMin) || undefined,
                    perceivedDifficulty: Number(perceived) || undefined,
                    createdAt: new Date().toISOString(),
                  });
                  if (!result.ok) {
                    setFeedbackSaved(false);
                    return;
                  }
                }
                setFeedbackSaved(true);
                onFeedbackSaved?.();
              }}
            >
              保存回填
            </button>
            {feedbackSaved ? (
              <p className="text-xs text-[var(--pine)]">已保存到本地回填记录。</p>
            ) : null}
          </div>
        </>
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
