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
import { saveAnalysis } from "@/lib/history/storage";
import { loadProfile, saveProfile } from "@/lib/profile/storage";
import { fetchWeather } from "@/lib/weather/fetchWeather";

type SampleMeta = {
  id: string;
  name: string;
  region: string;
  blurb: string;
  stats?: string;
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
  const [hikeDate, setHikeDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [plannedStart, setPlannedStart] = useState<string | undefined>();
  const [savedId, setSavedId] = useState<string | undefined>();
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/samples/manifest.json")
      .then((r) => r.json())
      .then((data: SampleMeta[]) => setSamples(data))
      .catch(() => setError("无法加载示例路线列表。"));
  }, []);

  const runFromPoints = useCallback(
    async (
      nextPoints: TrackPoint[],
      title: string,
      source: "sample" | "upload",
      nextProfile?: Partial<UserProfile>,
      nextStage: Stage = "base",
      startIso?: string,
      date = hikeDate,
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

      const center =
        nextPoints[Math.floor(nextPoints.length / 2)] ?? nextPoints[0];
      const weather = await fetchWeather(center.lat, center.lon, date);

      const result = analyzeRoute({
        points: nextPoints,
        profile: nextProfile,
        weather,
        plannedStart: startIso,
      });
      setPoints(nextPoints);
      setAnalysis(result);
      setActiveTitle(title);
      setStage(nextStage);
      setPlannedStart(result.recommendation.suggestedStart);
      trackEvent(nextStage === "personal" ? "analyze_personal" : "analyze_base", {
        source,
        distanceKm: result.route.distanceKm,
      });
      if (nextStage === "personal") {
        const saved = saveAnalysis({
          title,
          analysis: result,
          points: nextPoints,
          profileSnapshot: nextProfile,
          replaceId: savedId,
        });
        if (saved.ok) {
          setSavedId(saved.id);
          setSaveWarning(null);
        } else {
          setSaveWarning(saved.message);
        }
        void fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysis: result }),
        })
          .then(async (res) => {
            const data = (await res.json()) as {
              text?: string;
              source?: "template" | "llm";
            };
            if (!data.text) return;
            setAnalysis((prev) =>
              prev
                ? {
                    ...prev,
                    explanation: {
                      text: data.text as string,
                      source: data.source === "llm" ? "llm" : "template",
                    },
                  }
                : prev,
            );
          })
          .catch(() => {
            /* keep engine template */
          });
      }
    },
    [hikeDate, savedId],
  );

  const runFromXml = useCallback(
    async (xml: string, title: string, source: "sample" | "upload") => {
      await runFromPoints(parseGpx(xml), title, source);
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
        await runFromXml(xml, sample.name, "sample");
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
        trackEvent("upload", { bytes: file.size, name: file.name || "unknown" });
        await runFromXml(validated.xml, validated.displayName, "upload");
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
    async (next: Partial<UserProfile> | undefined, skipped: boolean) => {
      const effective = skipped
        ? { experience: "intermediate" as const }
        : next;
      if (!skipped && next) {
        saveProfile(next);
        setProfile(next);
      }
      setLoadingId("personal");
      setSavedId(undefined);
      await runFromPoints(
        points,
        activeTitle ?? "路线分析",
        "sample",
        effective,
        "personal",
        plannedStart,
        hikeDate,
      );
      setLoadingId(null);
    },
    [activeTitle, hikeDate, plannedStart, points, runFromPoints],
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
              先得到路线基础负荷，再可选完善档案与出行日期，算出对你的难度。
            </p>

            <div className="mt-8">
              <input
                ref={fileRef}
                type="file"
                // Intentionally broad: iOS Files grays out .gpx when accept is narrow.
                // Content validation happens in readAndValidateGpxFile.
                accept="*/*"
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
              <p className="mt-3 text-xs leading-relaxed text-[var(--rock)]">
                iPhone：若文件发灰，请选「浏览」→「文件」，不要限制只看 GPX；我们会按内容识别轨迹。
              </p>
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
                    {sample.stats ? (
                      <p className="mt-2 text-xs tabular-nums text-[var(--rock)]">
                        {sample.stats}
                      </p>
                    ) : null}
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
            <p className="mt-3 mb-4 text-sm text-[var(--ink-soft)]">
              四问即可拉开个人难度；再选出行日期以纳入天气与日落。
            </p>
            <label className="mb-6 block text-sm text-[var(--rock)]">
              计划出行日期
              <input
                type="date"
                value={hikeDate}
                onChange={(e) => setHikeDate(e.target.value)}
                className="mt-1 w-full border border-black/15 bg-white px-3 py-2 text-[var(--ink)]"
              />
            </label>
            <ProfileForm
              initial={profile ?? undefined}
              onSubmit={(p) => applyProfile(p, false)}
              onSkip={() => applyProfile(undefined, true)}
            />
            {loadingId === "personal" ? (
              <p className="mt-4 text-sm text-[var(--rock)]">正在生成个人报告…</p>
            ) : null}
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
            {saveWarning ? (
              <p className="mb-4 text-sm text-amber-800" role="status">
                {saveWarning}
              </p>
            ) : null}
            <BaseReport
              analysis={analysis}
              title={activeTitle}
              mode="personal"
              analysisId={savedId}
              onStartChange={async (iso) => {
                setPlannedStart(iso);
                await runFromPoints(
                  points,
                  activeTitle ?? "路线分析",
                  "sample",
                  profile ?? { experience: "intermediate" },
                  "personal",
                  iso,
                  hikeDate,
                );
              }}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
