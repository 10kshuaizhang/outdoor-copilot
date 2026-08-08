import {
  MODEL_VERSION,
  type AnalysisEntity,
  type OutdoorProfile,
  type Prediction,
  type RouteEntity,
} from "@/domain/types";
import type { RouteAnalysis, TrackPoint } from "@/lib/engine";
import { STORAGE_KEYS } from "./keys";
import { readJson, writeJson } from "./jsonStore";
import { getOrCreateUser } from "./userStore";

export type SavePredictionInput = {
  title: string;
  points: TrackPoint[];
  analysis: RouteAnalysis;
  profileSnapshot: Partial<OutdoorProfile>;
  source: "upload" | "sample";
};

export type SavePredictionResult =
  | { ok: true; prediction: Prediction }
  | { ok: false; message: string };

function listRoutes(): RouteEntity[] {
  return readJson<RouteEntity[]>(STORAGE_KEYS.routes, []);
}

function listAnalyses(): AnalysisEntity[] {
  return readJson<AnalysisEntity[]>(STORAGE_KEYS.analyses, []);
}

export function listPredictions(): Prediction[] {
  return readJson<Prediction[]>(STORAGE_KEYS.predictions, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getPrediction(id: string): Prediction | undefined {
  return listPredictions().find((p) => p.id === id);
}

export function getRoute(id: string): RouteEntity | undefined {
  return listRoutes().find((r) => r.id === id);
}

export function getAnalysis(id: string): AnalysisEntity | undefined {
  return listAnalyses().find((a) => a.id === id);
}

/**
 * Persist Route + Analysis + immutable Prediction.
 * Never overwrites an existing Prediction row.
 */
export function savePrediction(input: SavePredictionInput): SavePredictionResult {
  if (typeof window === "undefined") {
    return { ok: false, message: "当前环境无法保存预测。" };
  }
  try {
    const user = getOrCreateUser();
    const now = new Date().toISOString();
    const routeId = crypto.randomUUID();
    const analysisId = crypto.randomUUID();
    const predictionId = crypto.randomUUID();

    const route: RouteEntity = {
      id: routeId,
      userId: user.id,
      title: input.title,
      createdAt: now,
      summary: input.analysis.route,
      segments: input.analysis.segments,
      points: input.points,
      source: input.source,
    };

    const analysisEntity: AnalysisEntity = {
      id: analysisId,
      userId: user.id,
      routeId,
      createdAt: now,
      modelVersion: MODEL_VERSION,
      result: input.analysis,
      profileSnapshot: input.profileSnapshot,
    };

    const prediction: Prediction = {
      id: predictionId,
      userId: user.id,
      routeId,
      analysisId,
      createdAt: now,
      modelVersion: MODEL_VERSION,
      title: input.title,
      personalDifficulty: input.analysis.personalDifficulty,
      band: input.analysis.band,
      confidence: input.analysis.confidence,
      duration: input.analysis.duration,
      weatherSnapshot: input.analysis.weather,
      profileSnapshot: input.profileSnapshot,
      explanation: input.analysis.explanation,
      status: "saved",
      outcomeId: null,
    };

    const routes = [route, ...listRoutes()].slice(0, 40);
    const analyses = [analysisEntity, ...listAnalyses()].slice(0, 40);
    const predictions = [prediction, ...listPredictions()].slice(0, 40);

    if (!writeJson(STORAGE_KEYS.routes, routes)) {
      return { ok: false, message: "路线写入失败（存储可能已满）。" };
    }
    if (!writeJson(STORAGE_KEYS.analyses, analyses)) {
      return { ok: false, message: "分析快照写入失败。" };
    }
    if (!writeJson(STORAGE_KEYS.predictions, predictions)) {
      return { ok: false, message: "预测写入失败。" };
    }

    return { ok: true, prediction };
  } catch {
    return { ok: false, message: "保存预测失败。" };
  }
}

/** Mark hiking intent without mutating prediction scores. */
export function markPredictionHiking(id: string): boolean {
  const list = listPredictions();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  // Only status may change — scores stay frozen.
  list[idx] = { ...list[idx], status: "hiking" };
  return writeJson(STORAGE_KEYS.predictions, list);
}
