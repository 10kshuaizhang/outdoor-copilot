import type { HikeBrief, RouteAnalysis } from "@/lib/engine";
import { stripMultimodelFromShareText } from "@/lib/share/stripMultimodel";

/** Facts-only payload for XHS brief polish; copyText is the number source of truth. */
export function buildBriefPolishPayload(analysis: RouteAnalysis) {
  const brief = analysis.hikeBrief;
  if (!brief) return null;

  return {
    locale: "zh-CN",
    title: brief.headline,
    copyText: brief.copyText,
    brief: slimBriefForShare(brief),
    route: {
      distanceKm: analysis.route.distanceKm,
      elevationGainM: analysis.route.elevationGainM,
    },
    band: analysis.band,
  };
}

/** Slim brief for polish/share — omit multi-model (report UI keeps it). */
function slimBriefForShare(brief: HikeBrief) {
  return {
    verdict: brief.verdict,
    verdictLabel: brief.verdictLabel,
    headline: brief.headline,
    lead: stripMultimodelFromShareText(brief.lead),
    why: brief.why,
    weatherBlocks: brief.weatherBlocks.filter((b) => b.label !== "多模型"),
    audience: brief.audience,
    clothing: brief.clothing,
    gear: brief.gear,
    photoTips: brief.photoTips,
    phases: brief.phases,
    feel: brief.feel,
    actions: brief.actions,
  };
}
