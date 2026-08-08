"use client";

import Link from "next/link";
import { useState } from "react";
import { BaseReport } from "@/components/BaseReport";
import { exportEvents } from "@/lib/analytics/events";
import {
  clearAllLocalData,
  listAnalyses,
  type SavedAnalysis,
} from "@/lib/history/storage";

export default function HistoryPage() {
  const [items, setItems] = useState<SavedAnalysis[]>(() => listAnalyses());
  const [active, setActive] = useState<SavedAnalysis | null>(null);

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
              历史分析
            </h1>
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              数据仅保存在本机浏览器。
            </p>
            <ul className="mt-8 space-y-4">
              {items.length === 0 ? (
                <li className="text-sm text-[var(--rock)]">还没有保存的分析。</li>
              ) : (
                items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActive(item)}
                      className="w-full border-b border-black/10 pb-3 text-left"
                    >
                      <p className="font-[family-name:var(--font-display)] text-xl">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--rock)]">
                        {new Date(item.createdAt).toLocaleString("zh-CN")} · 个人{" "}
                        {item.analysis.personalDifficulty.overall}
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>

            <div className="mt-10 space-y-3 text-sm">
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
                导出本地事件
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
              className="mb-6 text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
            >
              ← 返回列表
            </button>
            <BaseReport
              analysis={active.analysis}
              title={active.title}
              mode="personal"
            />
          </>
        )}
      </div>
    </main>
  );
}
