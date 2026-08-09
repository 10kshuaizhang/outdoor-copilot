"use client";

import { useState } from "react";
import type { HikeBrief } from "@/lib/engine";

type Props = {
  brief: HikeBrief;
  enableCopy?: boolean;
};

function verdictClass(verdict: HikeBrief["verdict"]): string {
  if (verdict === "nogo") return "text-red-800";
  if (verdict === "caution") return "text-amber-800";
  return "text-[var(--pine-deep)]";
}

export function RouteBriefCard({ brief, enableCopy = true }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${brief.copyText}\n\n#户外徒步 #徒步天气预报 #徒步路线推荐 #OutdoorCopilot`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="space-y-4 border border-[var(--pine-deep)]/20 bg-white/70 px-4 py-5">
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
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">
          路线分段
        </p>
        <ul className="mt-2 space-y-2 text-sm">
          {brief.phases.map((p) => (
            <li
              key={p.label}
              className="border-b border-black/5 pb-2 last:border-0"
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
        <button
          type="button"
          onClick={() => void onCopy()}
          className="w-full border border-[var(--pine-deep)] px-4 py-2.5 text-sm font-semibold text-[var(--pine-deep)]"
        >
          {copied ? "已复制简报" : "复制徒步简报（发小红书）"}
        </button>
      ) : null}
    </section>
  );
}
