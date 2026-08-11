import type { RouteAnalysis } from "@/lib/engine";
import { findHardestStretch, effortLabelZh } from "@/lib/engine";
import { formatShanghaiClock } from "@/lib/time/china";

/**
 * Slim, LLM-safe payload: wall-clock times only, no raw UTC ISO that
 * models misread as "23:30 出发".
 */
export function buildOverviewExplainPayload(analysis: RouteAnalysis) {
  const hardest = findHardestStretch(analysis.segments);
  const startLocal = formatShanghaiClock(analysis.recommendation.suggestedStart);

  return {
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
    route: {
      distanceKm: analysis.route.distanceKm,
      elevationGainM: analysis.route.elevationGainM,
      elevationLossM: analysis.route.elevationLossM,
      minElevM: analysis.route.minElevM,
      maxElevM: analysis.route.maxElevM,
    },
    scores: {
      personalOverall: analysis.personalDifficulty.overall,
      baseOverall: analysis.baseDifficulty.overall,
      band: analysis.band,
      confidence: analysis.confidence,
    },
    duration: {
      movingMin: analysis.duration.movingMin,
      totalMin: analysis.duration.totalMin,
      lowMin: analysis.duration.lowMin,
      highMin: analysis.duration.highMin,
      meaning:
        "行进向估计（徒步移动 + 少量必要休息）。不含长时间观景、拍照、用餐；休闲节奏会明显更长，不要改数字去迎合。",
    },
    recommendation: {
      suggestedStartLocal: startLocal,
      finishWindowLocal: analysis.recommendation.finishWindow ?? null,
      waterLiters: analysis.recommendation.waterCarryLiters ?? analysis.recommendation.waterLiters ?? null,
      waterCarryLiters: analysis.recommendation.waterCarryLiters ?? null,
      waterConsumeLiters: analysis.recommendation.waterConsumeLiters ?? null,
      waterNote: analysis.recommendation.waterNote ?? null,
      mainRisk: analysis.recommendation.mainRisk ?? null,
      paceNote: analysis.recommendation.paceNote ?? null,
    },
    weather: {
      temperatureC: analysis.weather.temperatureC ?? null,
      precipMm: analysis.weather.precipMm ?? null,
      windMs: analysis.weather.windMs ?? null,
      thunderstormRisk: analysis.weather.thunderstormRisk ?? null,
      source: analysis.weather.source,
    },
    contributions: analysis.contributions.slice(0, 6).map((c) => ({
      label: c.label,
      delta: c.delta,
    })),
    challenges: analysis.challenges.map((c) => ({
      title: c.title,
      startKm: c.startKm,
      endKm: c.endKm,
      kind: c.kind,
    })),
    hardestStretch: hardest
      ? {
          startKm: hardest.startKm,
          endKm: hardest.endKm,
          gainM: hardest.gainM,
          avgGradePct: hardest.avgGradePct,
          labelZh: effortLabelZh(hardest.label),
          estimatedEffort: hardest.estimatedEffort,
        }
      : null,
    hikeBrief: analysis.hikeBrief
      ? {
          verdict: analysis.hikeBrief.verdict,
          verdictLabel: analysis.hikeBrief.verdictLabel,
          headline: analysis.hikeBrief.headline,
          lead: analysis.hikeBrief.lead,
          why: analysis.hikeBrief.why,
          weatherBlocks: analysis.hikeBrief.weatherBlocks,
          audience: analysis.hikeBrief.audience,
          clothing: analysis.hikeBrief.clothing,
          gear: analysis.hikeBrief.gear,
          photoTips: analysis.hikeBrief.photoTips,
          phases: analysis.hikeBrief.phases,
          actions: analysis.hikeBrief.actions,
        }
      : null,
  };
}
