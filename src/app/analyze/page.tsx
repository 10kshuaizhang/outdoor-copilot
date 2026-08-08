import Link from "next/link";

/**
 * Ticket 01 placeholder entry for the analyze flow.
 * Later tickets add samples, upload, and full reports.
 */
export default function AnalyzePage() {
  return (
    <main className="min-h-dvh bg-[var(--cream)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
        <Link
          href="/"
          className="mb-10 text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
        >
          ← Outdoor Copilot
        </Link>

        <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.16em] text-[var(--pine)]">
          分析入口
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight tracking-[-0.02em]">
          准备分析你的路线
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
          示例路线与 GPX 上传将在下一张工单接入。当前已接通统一分析入口{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-sm">
            analyzeRoute
          </code>
          。
        </p>

        <div className="mt-10 border-t border-black/10 pt-6 text-sm leading-relaxed text-[var(--rock)]">
          本工具仅提供辅助判断，不能替代你的经验、向导建议或现场决策。
        </div>
      </div>
    </main>
  );
}
