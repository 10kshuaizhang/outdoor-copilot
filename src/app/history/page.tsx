"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BaseReport } from "@/components/BaseReport";
import { PredictionCard } from "@/components/PredictionCard";
import {
  getAnalysis,
  getRoute,
  listPredictions,
  markPredictionHiking,
  type Prediction,
} from "@/domain";
import { clearAllLocalData } from "@/lib/history/storage";
import { scoreBand } from "@/lib/engine";

export default function HistoryPage() {
  const [items, setItems] = useState<Prediction[]>(() => listPredictions());
  const [active, setActive] = useState<Prediction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeAnalysis = useMemo(() => {
    if (!active) return null;
    return getAnalysis(active.analysisId)?.result ?? null;
  }, [active]);

  const activeRoute = useMemo(() => {
    if (!active) return null;
    return getRoute(active.routeId) ?? null;
  }, [active]);

  return (
    <main className="app-atmosphere min-h-dvh text-[var(--ink)]">
      <div className="mx-auto w-full max-w-lg px-5 py-8">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 cursor-pointer items-center text-sm text-[var(--pine-deep)] underline-offset-4 transition hover:underline"
        >
          ← Outdoor Copilot
        </Link>

        {!active ? (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[-0.02em]">
              已保存的预测
            </h1>
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              已保存的预测不会被算法升级改写。
            </p>
            <ul className="mt-8 space-y-3">
              {items.length === 0 ? (
                <li className="space-y-4 py-2">
                  <p className="font-[family-name:var(--font-serif-sc)] text-base text-[var(--ink-soft)]">
                    还没有保存的预测。
                  </p>
                  <Link
                    href="/analyze"
                    className="btn-accent inline-flex min-h-12 px-6 py-3.5 text-sm"
                  >
                    去分析一条路线
                  </Link>
                </li>
              ) : (
                items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActive(item);
                        setMessage(null);
                      }}
                      className="panel w-full cursor-pointer px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
                    >
                      <p className="font-[family-name:var(--font-display)] text-xl">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--rock)]">
                        {new Date(item.createdAt).toLocaleString("zh-CN")} ·{" "}
                        {item.personalDifficulty.overall}/100（
                        {scoreBand(item.personalDifficulty.overall)}）·{" "}
                        {item.status === "hiking" ? "准备徒步" : "已保存"}
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>

            {items.length > 0 ? (
              <div className="mt-10 space-y-3 text-sm">
                <Link
                  href="/analyze"
                  className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-[var(--cta)] underline-offset-4 transition hover:underline"
                >
                  新建分析 →
                </Link>
                <button
                  type="button"
                  className="block min-h-11 cursor-pointer text-[var(--rock)] underline-offset-4 transition hover:underline"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "确定清除本机全部预测与档案？此操作不可撤销。",
                      )
                    ) {
                      return;
                    }
                    clearAllLocalData();
                    setItems([]);
                  }}
                >
                  清除本机数据
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="mb-4 inline-flex min-h-11 cursor-pointer items-center text-sm text-[var(--pine-deep)] underline-offset-4 transition hover:underline"
            >
              ← 返回列表
            </button>
            {message ? (
              <p className="mb-4 text-sm text-[var(--pine)]">{message}</p>
            ) : null}
            {activeAnalysis ? (
              <>
                <PredictionCard
                  analysis={activeAnalysis}
                  saved
                  onMarkHiking={() => {
                    markPredictionHiking(active.id);
                    setItems(listPredictions());
                    setActive(getPredictionFresh(active.id));
                    setMessage("已标记「准备徒步」。");
                  }}
                />
                {activeRoute ? (
                  <p className="mt-4 text-xs text-[var(--rock)]">
                    {activeRoute.summary.distanceKm.toFixed(1)} km · 爬升 +
                    {activeRoute.summary.elevationGainM} m
                  </p>
                ) : null}
                <div className="mt-8">
                  <BaseReport
                    analysis={activeAnalysis}
                    title={active.title}
                    mode="personal"
                    hideScoreHero
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-amber-800">
                找不到关联分析快照。预测数字仍在：个人{" "}
                {active.personalDifficulty.overall}/100，时长{" "}
                {active.duration.lowMin}–{active.duration.highMin} 分钟。
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function getPredictionFresh(id: string): Prediction | null {
  return listPredictions().find((p) => p.id === id) ?? null;
}
