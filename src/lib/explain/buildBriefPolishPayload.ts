import type { HikeBrief, RouteAnalysis } from "@/lib/engine";

/** Facts-only payload for XHS brief polish; copyText is the number source of truth. */
export function buildBriefPolishPayload(analysis: RouteAnalysis) {
  const brief = analysis.hikeBrief;
  if (!brief) return null;

  return {
    locale: "zh-CN",
    title: brief.headline,
    copyText: brief.copyText,
    brief: slimBrief(brief),
    route: {
      distanceKm: analysis.route.distanceKm,
      elevationGainM: analysis.route.elevationGainM,
    },
    band: analysis.band,
  };
}

function slimBrief(brief: HikeBrief) {
  return {
    verdict: brief.verdict,
    verdictLabel: brief.verdictLabel,
    headline: brief.headline,
    lead: brief.lead,
    why: brief.why,
    weatherBlocks: brief.weatherBlocks,
    audience: brief.audience,
    clothing: brief.clothing,
    gear: brief.gear,
    photoTips: brief.photoTips,
    phases: brief.phases,
    feel: brief.feel,
    actions: brief.actions,
  };
}
