"use client";

import { useState } from "react";
import type { HikeBrief } from "@/lib/engine";
import { copyToClipboard } from "@/lib/share/exportSummary";
import { stripMultimodelFromShareText } from "@/lib/share/stripMultimodel";

type Props = {
  brief: HikeBrief;
  enableCopy?: boolean;
};

function verdictClass(verdict: HikeBrief["verdict"]): string {
  if (verdict === "nogo") return "text-red-800";
  if (verdict === "caution") return "text-amber-800";
  return "text-[var(--pine-deep)]";
}

function buildShareText(body: string): string {
  return `${stripMultimodelFromShareText(body)}\n\n#户外徒步 #徒步天气预报 #徒步路线推荐 #OutdoorCopilot`;
}

export function RouteBriefCard({ brief, enableCopy = true }: Props) {
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const [showManual, setShowManual] = useState(false);
  const shareBody = brief.polishedCopy?.trim() || brief.copyText;
  const shareText = buildShareText(shareBody);

  const onCopy = async () => {
    const ok = await copyToClipboard(shareText);
    if (ok) {
      setCopyState("ok");
      setShowManual(false);
      setTimeout(() => setCopyState("idle"), 2000);
      return;
    }
    setCopyState("fail");
    setShowManual(true);
  };

  return (
    <section className="panel space-y-4 px-4 py-5">
      <div>
        <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.14em] text-[var(--pine)]">
          徒步简报
        </p>
        <p
          className={`mt-2 font-[family-name:var(--font-display)] text-2xl leading-snug tracking-[-0.02em] ${verdictClass(brief.verdict)}`}
        >
          {brief.headline}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          {brief.lead}
        </p>
      </div>

      <div>
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">天气分项</p>
        <ul className="mt-2 space-y-2.5 text-sm">
          {brief.weatherBlocks.map((b) => (
            <li key={b.label}>
              <p className="font-semibold text-[var(--pine-deep)]">{b.label}</p>
              <p className="mt-0.5 leading-relaxed text-[var(--ink-soft)]">
                {b.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">整体判断</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li>
            <span className="font-semibold">新手 · </span>
            {brief.audience.novice}
          </li>
          <li>
            <span className="font-semibold">老驴 · </span>
            {brief.audience.experienced}
          </li>
        </ul>
      </div>

      <div>
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">穿衣</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {brief.clothing.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">装备</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {brief.gear.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">出片</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {brief.photoTips.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">
          路线分段
        </p>
        <ul className="mt-2 space-y-2 text-sm">
          {brief.phases.map((p) => (
            <li
              key={p.label}
              className="border-b border-[var(--border-soft)] pb-2 last:border-0"
            >
              <span className="font-semibold text-[var(--pine-deep)]">
                {p.label}
              </span>
              <span className="text-[var(--ink-soft)]"> · {p.detail}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">行动</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {brief.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </div>

      {enableCopy ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void onCopy()}
            className="btn-ghost min-h-11 w-full px-4 py-2.5 text-sm"
          >
            {copyState === "ok"
              ? "已复制"
              : copyState === "fail"
                ? "自动复制失败，请手动复制下方文案"
                : "复制简报文案"}
          </button>
          {brief.copySource ? (
            <p className="text-center text-xs text-[var(--rock)]">
              {brief.copySource === "llm"
                ? "文案已润色（数字仍来自引擎）"
                : "模板文案"}
            </p>
          ) : null}
          {showManual ? (
            <textarea
              readOnly
              value={shareText}
              rows={8}
              className="field-input resize-y text-sm"
              onFocus={(e) => e.currentTarget.select()}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
