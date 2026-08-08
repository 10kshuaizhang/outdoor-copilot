"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BaseReport } from "@/components/BaseReport";
import { ProfileForm } from "@/components/ProfileForm";
import { trackEvent } from "@/lib/analytics/events";
import {
  analyzeRoute,
  parseGpx,
  type RouteAnalysis,
  type TrackPoint,
  type UserProfile,
} from "@/lib/engine";
import { readAndValidateGpxFile } from "@/lib/engine/validateUpload";
import { loadProfile, saveProfile } from "@/lib/profile/storage";

type SampleMeta = {
  id: string;
  name: string;
  region: string;
  blurb: string;
  file: string;
};

type Stage = "pick" | "base" | "profile" | "personal";

export default function AnalyzePage() {
  const [samples, setSamples] = useState<SampleMeta[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>();
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [stage, setStage] = useState<Stage>("pick");
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(() =>
    loadProfile(),
  );
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/samples/manifest.json")
      .then((r) => r.json())
      .then((data: SampleMeta[]) => setSamples(data))
      .catch(() => setError("无法加载示例路线列表。"));
  }, []);

  const runFromPoints = useCallback(
    (
      nextPoints: TrackPoint[],
      title: string,
      source: "sample" | "upload",
      nextProfile?: Partial<UserProfile>,
      nextStage: Stage = "base",
    ) => {
      if (nextPoints.length < 2) {
        setError(
          source === "upload"
            ? "轨迹点太少，无法分析。请换一个包含完整路线的 GPX，或改用示例。"
            : "示例轨迹无效，请换一条路线。",
        );
        setAnalysis(null);
        return;
      }
      const result = analyzeRoute({
        points: nextPoints,
        profile: nextProfile,
        weather: { source: "fallback" },
      });
      setPoints(nextPoints);
      setAnalysis(result);
      setActiveTitle(title);
      setStage(nextStage);
      trackEvent(nextStage === "personal" ? "analyze_personal" : "analyze_base", {
        source,
        distanceKm: result.route.distanceKm,
      });
    },
    [],
  );

  const runFromXml = useCallback(
    (xml: string, title: string, source: "sample" | "upload") => {
      runFromPoints(parseGpx(xml), title, source);
    },
    [runFromPoints],
  );

  const runSample = useCallback(
    async (sample: SampleMeta) => {
      setLoadingId(sample.id);
      setError(null);
      try {
        const res = await fetch(sample.file);
        if (!res.ok) throw new Error("fetch failed");
        const xml = await res.text();
        runFromXml(xml, sample.name, "sample");
      } catch {
        setError("分析失败，请稍后重试。");
        setAnalysis(null);
      } finally {
        setLoadingId(null);
      }
    },
    [runFromXml],
  );

  const onUpload = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setLoadingId("upload");
      setError(null);
      try {
        const validated = await readAndValidateGpxFile(file);
        if (!validated.ok) {
          setError(validated.message);
          setAnalysis(null);
          return;
        }
        trackEvent("upload", { bytes: file.size, name: file.name });
        runFromXml(validated.xml, file.name.replace(/\.gpx$/i, ""), "upload");
      } catch {
        setError("读取文件失败，请重试或改用示例路线。");
        setAnalysis(null);
      } finally {
        setLoadingId(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [runFromXml],
  );

  const applyProfile = useCallback(
    (next: Partial<UserProfile> | undefined, skipped: boolean) => {
      if (!skipped && next) {
        saveProfile(next);
        setProfile(next);
      }
      runFromPoints(
        points,
        activeTitle ?? "路线分析",
        "sample",
        skipped ? undefined : next,
        "personal",
      );
    },
    [activeTitle, points, runFromPoints],
  );

  return (
    <main className="min-h-dvh bg-[var(--cream)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
        <Link
          href="/"
          className="mb-8 text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
        >
          ← Outdoor Copilot
        </Link>

        {stage === "pick" ? (
          <>
            <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.16em] text-[var(--pine)]">
              分析入口
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight tracking-[-0.02em]">
              上传 GPX 或选示例
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
              先得到路线基础负荷，再可选完善档案，算出对你的难度。
            </p>

            <div className="mt-8">
              <input
                ref={fileRef}
                type="file"
                accept=".gpx,application/gpx+xml,text/xml"
                className="sr-only"
                id="gpx-upload"
                onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="gpx-upload"
                className="inline-flex cursor-pointer items-center justify-center bg-[var(--pine-deep)] px-6 py-3.5 text-sm font-semibold text-[var(--cream)]"
              >
                {loadingId === "upload" ? "正在分析…" : "上传 GPX 文件"}
              </label>
            </div>

            <p className="mt-10 font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.14em] text-[var(--pine)]">
              或使用示例
            </p>
            <ul className="mt-4 space-y-4">
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
        ) : null}

        {stage === "base" && analysis ? (
          <>
            <button
              type="button"
              onClick={() => {
                setAnalysis(null);
                setPoints([]);
                setStage("pick");
                setActiveTitle(undefined);
              }}
              className="mb-6 self-start text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
            >
              ← 换一条路线
            </button>
            <BaseReport
              analysis={analysis}
              title={activeTitle}
              mode="base"
              onPersonalize={() => setStage("profile")}
            />
            <button
              type="button"
              onClick={() => applyProfile(undefined, true)}
              className="mt-4 text-sm text-[var(--rock)] underline-offset-4 hover:underline"
            >
              跳过，用默认档案查看个人报告
            </button>
          </>
        ) : null}

        {stage === "profile" ? (
          <>
            <button
              type="button"
              onClick={() => setStage("base")}
              className="mb-6 self-start text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
            >
              ← 返回基础报告
            </button>
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
              你的户外档案
            </h2>
            <p className="mt-3 mb-6 text-sm text-[var(--ink-soft)]">
              四问即可拉开个人难度；生理数据可选，用于提高置信度。
            </p>
            <ProfileForm
              initial={profile ?? undefined}
              onSubmit={(p) => applyProfile(p, false)}
              onSkip={() => applyProfile(undefined, true)}
            />
          </>
        ) : null}

        {stage === "personal" && analysis ? (
          <>
            <button
              type="button"
              onClick={() => setStage("profile")}
              className="mb-6 self-start text-sm text-[var(--pine-deep)] underline-offset-4 hover:underline"
            >
              ← 调整档案
            </button>
            <BaseReport
              analysis={analysis}
              title={activeTitle}
              mode="personal"
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
