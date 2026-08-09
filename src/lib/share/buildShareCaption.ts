import { scoreBand, type RouteAnalysis } from "@/lib/engine";

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

/** Xiaohongshu-oriented caption (paste with the share image). */
export function buildShareCaption(
  analysis: RouteAnalysis,
  title = "路线分析",
): string {
  if (analysis.hikeBrief) {
    const body =
      analysis.hikeBrief.polishedCopy?.trim() || analysis.hikeBrief.copyText;
    return [
      `【${title}】${analysis.hikeBrief.verdictLabel}`,
      body,
      "",
      "Outdoor Copilot · 先看清这条路对你有多难",
      "#户外徒步 #徒步天气预报 #徒步路线推荐 #OutdoorCopilot #个人难度",
    ].join("\n");
  }

  const personal = analysis.personalDifficulty.overall;
  const band = scoreBand(personal);
  const { route, duration, recommendation } = analysis;
  const lines = [
    `${title} · 对我 ${personal}/100（${band}）`,
    `${route.distanceKm.toFixed(1)} km · 爬升 +${route.elevationGainM} m`,
    `预估 ${formatDuration(duration.lowMin)}–${formatDuration(duration.highMin)}`,
  ];
  if (recommendation.mainRisk) {
    lines.push(`留意：${recommendation.mainRisk}`);
  }
  lines.push("");
  lines.push("先看清这条路对你有多难 · Outdoor Copilot");
  lines.push("#徒步 #户外 #登山 #周末去哪儿 #OutdoorCopilot #个人难度");
  return lines.join("\n");
}
