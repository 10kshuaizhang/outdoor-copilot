import type { HikeBrief, RouteAnalysis } from "@/lib/engine";
import { xhsPolishTargetChars } from "@/lib/share/xhsLimit";

/** Facts-only payload for XHS brief polish; copyText is the number source of truth. */
export function buildBriefPolishPayload(analysis: RouteAnalysis) {
  const brief = analysis.hikeBrief;
  if (!brief) return null;

  const maxChars = xhsPolishTargetChars({
    title: brief.headline,
    verdictLabel: brief.verdictLabel,
  });

  return {
    locale: "zh-CN",
    title: brief.headline,
    copyText: brief.copyText,
    /** Hard ceiling for polished body (XHS 1000 total incl. client footer). */
    maxChars,
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
