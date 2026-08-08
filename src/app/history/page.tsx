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
import { exportEvents } from "@/lib/analytics/events";
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
    <main className="min-h-dvh bg-[var(--cream)] text-[var(--ink)]">
      <div className="mx-auto w-full max-w-lg px-5 py-8">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
        >
          ← Outdoor Copilot
        </Link>

        {!active ? (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[-0.02em]">
              已保存的预测
            </h1>
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              Prediction 独立、不可变（
              <code className="text-xs">modelVersion: v0.1-analyze</code>
              ）。算法升级不会改写这里的数字。
            </p>
            <ul className="mt-8 space-y-4">
              {items.length === 0 ? (
                <li className="text-sm text-[var(--rock)]">
                  还没有保存的预测。去分析页生成并点「保存这次预测」。
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
                      className="w-full border-b border-black/10 pb-3 text-left"
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

            <div className="mt-10 space-y-3 text-sm">
              <Link
                href="/analyze"
                className="block font-semibold text-[var(--pine-deep)] underline-offset-4 hover:underline"
              >
                新建分析 →
              </Link>
              <button
                type="button"
                className="underline-offset-4 hover:underline"
                onClick={() => {
                  const blob = new Blob(
                    [JSON.stringify(exportEvents(), null, 2)],
                    { type: "application/json" },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "outdoor-copilot-events.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                导出漏斗事件
              </button>
              <button
                type="button"
                className="block text-red-800 underline-offset-4 hover:underline"
                onClick={() => {
                  clearAllLocalData();
                  setItems([]);
                }}
              >
                清除全部本地数据
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="mb-4 text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
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
                <p className="mt-4 text-xs text-[var(--rock)]">
                  modelVersion: {active.modelVersion} · predictionId:{" "}
                  {active.id.slice(0, 8)}…
                  {activeRoute
                    ? ` · ${activeRoute.summary.distanceKm.toFixed(1)} km`
                    : ""}
                </p>
                <div className="mt-8">
                  <BaseReport
                    analysis={activeAnalysis}
                    title={active.title}
                    mode="personal"
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
