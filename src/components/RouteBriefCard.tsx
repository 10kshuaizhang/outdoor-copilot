"use client";

import { useState } from "react";
import type { HikeBrief } from "@/lib/engine";

type Props = {
  brief: HikeBrief;
  /** Show copy button for XHS-style paste. */
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
          {brief.verdictLabel}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          {brief.headline}
        </p>
      </div>

      <div>
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">为什么</p>
        <p className="mt-1 text-sm leading-relaxed">{brief.why}</p>
      </div>

      <div>
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">分段</p>
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
        <p className="text-xs tracking-[0.12em] text-[var(--rock)]">体感</p>
        <dl className="mt-2 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
          <div>
            <dt className="inline text-[var(--rock)]">晒 · </dt>
            <dd className="inline">{brief.feel.sun}</dd>
          </div>
          <div>
            <dt className="inline text-[var(--rock)]">热 · </dt>
            <dd className="inline">{brief.feel.heat}</dd>
          </div>
          <div>
            <dt className="inline text-[var(--rock)]">闷 · </dt>
            <dd className="inline">{brief.feel.humidity}</dd>
          </div>
          <div>
            <dt className="inline text-[var(--rock)]">路 · </dt>
            <dd className="inline">{brief.feel.slip}</dd>
          </div>
        </dl>
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
