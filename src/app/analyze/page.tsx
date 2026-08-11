"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BaseReport } from "@/components/BaseReport";
import { PredictionCard } from "@/components/PredictionCard";
import { ProfileForm, type ProfileFormValue } from "@/components/ProfileForm";
import {
  engineProfileToOutdoor,
  getOrCreateUser,
  loadOutdoorProfile,
  markPredictionHiking,
  outdoorProfileToEngine,
  saveOutdoorProfile,
  savePrediction,
  type OutdoorProfile,
} from "@/domain";
import { trackEvent } from "@/lib/analytics/events";
import {
  analyzeRoute,
  parseTrackXml,
  type RouteAnalysis,
  type TrackPoint,
} from "@/lib/engine";
import { readAndValidateTrackFile } from "@/lib/engine/validateUpload";
import {
  fetchBriefPolish,
  fetchExplanation,
} from "@/lib/explain/fetchExplanation";
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
type RouteSource = "sample" | "upload";

export default function AnalyzePage() {
  const [samples, setSamples] = useState<SampleMeta[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | undefined>();
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [routeSource, setRouteSource] = useState<RouteSource>("sample");
  const [stage, setStage] = useState<Stage>("pick");
  const [profile, setProfile] = useState<OutdoorProfile | null>(() =>
    loadOutdoorProfile(),
  );
  const [hikeDate, setHikeDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [plannedStart, setPlannedStart] = useState<string | undefined>();
  const [predictionId, setPredictionId] = useState<string | undefined>();
  const [predictionSaved, setPredictionSaved] = useState(false);
  const [savingPrediction, setSavingPrediction] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [hikeMessage, setHikeMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSamplesLoading(true);
    fetch("/api/samples")
      .then(async (r) => {
        if (!r.ok) throw new Error("api");
        return r.json() as Promise<SampleMeta[]>;
      })
      .then((data) => setSamples(data))
      .catch(() => {
        // Fallback to static seed if API unavailable.
        fetch("/samples/manifest.json")
          .then((r) => r.json())
          .then((data: SampleMeta[]) => setSamples(data))
          .catch(() => setError("无法加载示例路线列表。"));
      })
      .finally(() => setSamplesLoading(false));
  }, []);

  const runFromPoints = useCallback(
    async (
      nextPoints: TrackPoint[],
      title: string,
      source: RouteSource,
      nextProfile?: Partial<OutdoorProfile>,
      nextStage: Stage = "base",
      startIso?: string,
      date = hikeDate,
    ) => {
      if (nextPoints.length < 2) {
        setError(
          source === "upload"
            ? "轨迹点太少，无法分析。请换一个包含完整路线的 GPX / KML，或改用示例。"
            : "示例轨迹无效，请换一条路线。",
        );
        setAnalysis(null);
        return;
      }

      trackEvent("analysis_started", { source, stage: nextStage });

      const center =
        nextPoints[Math.floor(nextPoints.length / 2)] ?? nextPoints[0];
      const weather = await fetchWeather(center.lat, center.lon, date);
      const engineProfile = outdoorProfileToEngine(nextProfile);

      const result = analyzeRoute({
        points: nextPoints,
        profile: engineProfile,
        weather,
        plannedStart: startIso,
        title,
      });
      setPoints(nextPoints);
      setRouteSource(source);
      setAnalysis(result);
      setActiveTitle(title);
      setStage(nextStage);
      setPlannedStart(result.recommendation.suggestedStart);
      setPredictionSaved(false);
      setPredictionId(undefined);
      setHikeMessage(null);

      trackEvent(
        nextStage === "personal" ? "analyze_personal" : "analyze_base",
        { source, distanceKm: result.route.distanceKm },
      );
      trackEvent("analysis_completed", {
        source,
        stage: nextStage,
        overall:
          nextStage === "personal"
            ? result.personalDifficulty.overall
            : result.baseDifficulty.overall,
      });

      // High-priority LLM: polish XHS brief (base + personal). Numbers stay in engine.
      if (result.hikeBrief) {
        void fetchBriefPolish(result).then((polished) => {
          if (!polished?.text) return;
          setAnalysis((prev) => {
            if (!prev?.hikeBrief) return prev;
            return {
              ...prev,
              hikeBrief: {
                ...prev.hikeBrief,
                polishedCopy: polished.text,
                copySource: polished.source,
              },
            };
          });
        });
      }

      if (nextStage === "personal") {
        trackEvent("prediction_created", {
          overall: result.personalDifficulty.overall,
          confidence: Number(result.confidence.toFixed(2)),
        });
        void fetchExplanation(result).then((explained) => {
          if (!explained) return;
          setAnalysis((prev) =>
            prev
              ? {
                  ...prev,
                  explanation: {
                    text: explained.text,
                    source: explained.source,
                    model: explained.model,
                  },
                }
              : prev,
          );
        });
      }
    },
    [hikeDate],
  );

  const runFromXml = useCallback(
    async (xml: string, title: string, source: RouteSource) => {
      await runFromPoints(parseTrackXml(xml), title, source);
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
        const validated = await readAndValidateTrackFile(file);
        if (!validated.ok) {
          setError(validated.message);
          setAnalysis(null);
          return;
        }
        trackEvent("upload_gpx", {
          bytes: file.size,
          name: file.name || "unknown",
          format: validated.format,
        });
        trackEvent("upload", {
          bytes: file.size,
          format: validated.format,
        });
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
    async (next: ProfileFormValue | undefined, skipped: boolean) => {
      let outdoor: OutdoorProfile;
      if (!skipped && next) {
        outdoor = saveOutdoorProfile(next);
        setProfile(outdoor);
      } else {
        outdoor = engineProfileToOutdoor(getOrCreateUser().id, {
          experience: "beginner",
          comfortableDistanceKm: 10,
          comfortableElevationM: 500,
        });
      }
      setLoadingId("personal");
      await runFromPoints(
        points,
        activeTitle ?? "路线分析",
        routeSource,
        outdoor,
        "personal",
        plannedStart,
        hikeDate,
      );
      setLoadingId(null);
    },
    [activeTitle, hikeDate, plannedStart, points, routeSource, runFromPoints],
  );

  const onSavePrediction = useCallback(() => {
    if (!analysis || predictionSaved) return;
    setSavingPrediction(true);
    setSaveWarning(null);
    const snapshot =
      profile ??
      engineProfileToOutdoor("local", {
        experience: "beginner",
        comfortableDistanceKm: 10,
        comfortableElevationM: 500,
      });
    const result = savePrediction({
      title: activeTitle ?? "路线预测",
      points,
      analysis,
      profileSnapshot: snapshot,
      source: routeSource,
    });
    setSavingPrediction(false);
    if (!result.ok) {
      setSaveWarning(result.message);
      return;
    }
    setPredictionId(result.prediction.id);
    setPredictionSaved(true);
    trackEvent("prediction_saved", {
      predictionId: result.prediction.id,
      overall: result.prediction.personalDifficulty.overall,
    });
  }, [
    activeTitle,
    analysis,
    points,
    predictionSaved,
    profile,
    routeSource,
  ]);

  return (
    <main className="app-atmosphere min-h-dvh text-[var(--ink)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 cursor-pointer items-center text-sm text-[var(--pine-deep)] underline-offset-4 transition hover:underline"
        >
          ← Outdoor Copilot
        </Link>

        {stage === "pick" ? (
          <div className="reveal-up space-y-0">
            <p className="font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.16em] text-[var(--pine)]">
              分析入口
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight tracking-[-0.02em]">
              上传轨迹或选示例
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
              先看基础负荷，再填档案，生成并<strong>保存</strong>
              对你的预测——为徒步后对比打底。
            </p>

            <div className="mt-8">
              <input
                ref={fileRef}
                type="file"
                accept=".gpx,.kml,.xml,application/gpx+xml,application/vnd.google-earth.kml+xml,text/xml,*/*"
                className="sr-only"
                id="track-upload"
                onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="track-upload"
                className="btn-primary min-h-12 px-6 py-3.5 text-sm"
              >
                {loadingId === "upload" ? "正在分析…" : "上传 GPX / KML"}
              </label>
              <p className="mt-3 text-xs leading-relaxed text-[var(--rock)]">
                自动识别格式。iPhone：若文件发灰，请选「浏览」→「文件」。
              </p>
            </div>

            <p className="mt-10 font-[family-name:var(--font-serif-sc)] text-sm tracking-[0.14em] text-[var(--pine)]">
              或使用示例
            </p>
            <ul className="mt-4 space-y-3">
              {samplesLoading ? (
                <li className="py-4 text-sm text-[var(--rock)]">加载示例路线…</li>
              ) : null}
              {!samplesLoading && samples.length === 0 ? (
                <li className="py-2 text-sm text-[var(--rock)]">
                  暂无示例，请上传自己的轨迹。
                </li>
              ) : null}
              {samples.map((sample, index) => (
                <li
                  key={sample.id}
                  className="reveal-up-delay"
                  style={{ animationDelay: `${80 + index * 60}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => runSample(sample)}
                    disabled={loadingId === sample.id}
                    className="panel w-full cursor-pointer px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] disabled:cursor-not-allowed disabled:opacity-60"
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
                    <p className="mt-3 text-sm font-semibold text-[var(--cta)]">
                      {loadingId === sample.id ? "分析中…" : "一键分析 →"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            {error ? (
              <p
                className="mt-6 border border-amber-800/30 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
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
              className="mb-6 cursor-pointer self-start text-sm text-[var(--pine-deep)] underline-offset-4 transition hover:underline"
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
              className="mt-4 inline-flex min-h-11 cursor-pointer items-center self-center text-sm text-[var(--rock)] underline-offset-4 transition hover:underline"
            >
              用默认档案继续
            </button>
          </>
        ) : null}

        {stage === "profile" ? (
          <>
            <button
              type="button"
              onClick={() => setStage("base")}
              className="mb-6 inline-flex min-h-11 cursor-pointer items-center self-start text-sm text-[var(--pine-deep)] underline-offset-4 transition hover:underline"
            >
              ← 返回基础报告
            </button>
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.02em]">
              你的户外档案
            </h2>
            <p className="mt-3 mb-4 text-sm text-[var(--ink-soft)]">
              填写你的经验与舒适水平，生成这次对你的预测。选择出行日期以纳入天气。
            </p>
            <label className="mb-6 block text-sm text-[var(--rock)]">
              计划出行日期
              <input
                type="date"
                value={hikeDate}
                onChange={(e) => setHikeDate(e.target.value)}
                className="field-input mt-1"
              />
            </label>
            <ProfileForm
              initial={profile ?? undefined}
              onSubmit={(p) => applyProfile(p, false)}
            />
            {loadingId === "personal" ? (
              <p className="mt-4 text-sm text-[var(--rock)]">正在生成预测…</p>
            ) : null}
          </>
        ) : null}

        {stage === "personal" && analysis ? (
          <>
            <button
              type="button"
              onClick={() => setStage("profile")}
              className="mb-6 cursor-pointer self-start text-sm text-[var(--pine-deep)] underline-offset-4 transition hover:underline"
            >
              ← 调整档案
            </button>
            {saveWarning ? (
              <p className="mb-4 text-sm text-amber-800" role="status">
                {saveWarning}
              </p>
            ) : null}
            {hikeMessage ? (
              <p className="mb-4 text-sm text-[var(--pine)]" role="status">
                {hikeMessage}
              </p>
            ) : null}

            <PredictionCard
              analysis={analysis}
              saved={predictionSaved}
              saving={savingPrediction}
              onSave={onSavePrediction}
              onMarkHiking={() => {
                if (!predictionId) return;
                markPredictionHiking(predictionId);
                setHikeMessage(
                  "已标记「准备徒步」。走完后回来上传实际用时（即将支持）。",
                );
              }}
            />

            <div className="mt-10">
              <BaseReport
                analysis={analysis}
                title={activeTitle}
                mode="personal"
                hideScoreHero
                onStartChange={async (iso) => {
                  setPlannedStart(iso);
                  setPredictionSaved(false);
                  setPredictionId(undefined);
                  await runFromPoints(
                    points,
                    activeTitle ?? "路线分析",
                    routeSource,
                    profile ?? undefined,
                    "personal",
                    iso,
                    hikeDate,
                  );
                }}
              />
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
