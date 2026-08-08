"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BaseReport } from "@/components/BaseReport";
import {
  analyzeRoute,
  parseGpx,
  type RouteAnalysis,
} from "@/lib/engine";

type SampleMeta = {
  id: string;
  name: string;
  region: string;
  blurb: string;
  file: string;
};

export default function AnalyzePage() {
  const [samples, setSamples] = useState<SampleMeta[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>();

  useEffect(() => {
    fetch("/samples/manifest.json")
      .then((r) => r.json())
      .then((data: SampleMeta[]) => setSamples(data))
      .catch(() => setError("无法加载示例路线列表。"));
  }, []);

  const runSample = useCallback(async (sample: SampleMeta) => {
    setLoadingId(sample.id);
    setError(null);
    try {
      const res = await fetch(sample.file);
      if (!res.ok) throw new Error("fetch failed");
      const xml = await res.text();
      const points = parseGpx(xml);
      if (points.length < 2) {
        setError("示例轨迹无效，请换一条路线。");
        setAnalysis(null);
        return;
      }
      const result = analyzeRoute({
        points,
        weather: { source: "fallback" },
      });
      setAnalysis(result);
      setActiveTitle(sample.name);
    } catch {
      setError("分析失败，请稍后重试。");
      setAnalysis(null);
    } finally {
      setLoadingId(null);
    }
  }, []);

  return (
    <main className="min-h-dvh bg-[var(--cream)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
        <Link
          href="/"
          className="mb-8 text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
        >
          ← Outdoor Copilot
        </Link>

        {!analysis ? (
          <>
            <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.16em] text-[var(--pine)]">
              分析入口
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight tracking-[-0.02em]">
              选择一条示例路线
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
              先体验基础负荷分析。上传自己的 GPX 将在下一步开放。
            </p>

            <ul className="mt-8 space-y-4">
              {samples.map((sample) => (
                <li key={sample.id}>
                  <button
                    type="button"
                    onClick={() => runSample(sample)}
                    disabled={loadingId === sample.id}
                    className="w-full border-b border-black/10 pb-4 text-left transition hover:border-[var(--pine)] disabled:opacity-60"
                  >
                    <p className="text-xs tracking-[0.14em] text-[var(--pine)]">
                      {sample.region}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">
                      {sample.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {sample.blurb}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-[var(--pine-deep)]">
                      {loadingId === sample.id ? "分析中…" : "一键分析 →"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            {error ? (
              <p className="mt-6 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}

            <p className="mt-auto pt-10 text-xs leading-relaxed text-[var(--rock)]">
              本工具仅提供辅助判断，不能替代你的经验、向导建议或现场决策。
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setAnalysis(null);
                setActiveTitle(undefined);
              }}
              className="mb-6 self-start text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
            >
              ← 换一条路线
            </button>
            <BaseReport analysis={analysis} title={activeTitle} />
          </>
        )}
      </div>
    </main>
  );
}
