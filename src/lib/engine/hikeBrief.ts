import { scoreBand } from "./baseDifficulty";
import {
  effortLabelZh,
  findHardestStretch,
  type HardestStretch,
} from "./effort";
import type {
  DifficultyScores,
  HikeBrief,
  HikeBriefFeel,
  HikeBriefPhase,
  HikeVerdict,
  RouteSummary,
  Segment,
  WeatherSnapshot,
} from "./types";

export type { HikeBrief, HikeVerdict } from "./types";

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

function phaseEffortSummary(segs: Segment[]): string {
  if (segs.length === 0) return "数据不足";
  const gain = Math.round(segs.reduce((s, x) => s + x.gainM, 0));
  const loss = Math.round(segs.reduce((s, x) => s + x.lossM, 0));
  const labels = segs.map((s) => s.effortLabel);
  const hard = labels.filter((l) => l === "hard_climb").length;
  const descent = labels.filter((l) => l === "descent").length;
  if (hard >= Math.max(1, Math.floor(segs.length * 0.35))) {
    return `陡升偏多，累计爬升约 ${gain} m，注意留力`;
  }
  if (descent >= Math.max(1, Math.floor(segs.length * 0.4)) && loss > gain) {
    return `下坡为主，累计下降约 ${loss} m，控速防滑`;
  }
  if (gain >= 120) {
    return `爬升约 ${gain} m，节奏放稳`;
  }
  return `起伏缓和，爬升约 ${gain} m`;
}

function buildPhases(
  segments: Segment[],
  hardest: HardestStretch | null,
): HikeBriefPhase[] {
  if (segments.length === 0) return [];
  const endKm = segments[segments.length - 1].endKm;
  const cut1 = endKm / 3;
  const cut2 = (endKm * 2) / 3;

  const early = segments.filter((s) => s.endKm <= cut1 + 0.05);
  const mid = segments.filter((s) => s.startKm < cut2 && s.endKm > cut1);
  const late = segments.filter((s) => s.startKm >= cut2 - 0.05);

  const phases: HikeBriefPhase[] = [
    {
      label: `前段 0–${cut1.toFixed(1)} km`,
      detail: phaseEffortSummary(early.length ? early : segments.slice(0, 1)),
    },
    {
      label: `中段 ${cut1.toFixed(1)}–${cut2.toFixed(1)} km`,
      detail: phaseEffortSummary(mid.length ? mid : segments),
    },
    {
      label: `后段 ${cut2.toFixed(1)}–${endKm.toFixed(1)} km`,
      detail: phaseEffortSummary(late.length ? late : segments.slice(-1)),
    },
  ];

  if (hardest) {
    phases.push({
      label: `最难 ${hardest.startKm.toFixed(1)}–${hardest.endKm.toFixed(1)} km`,
      detail: `${effortLabelZh(hardest.label)}，爬升约 ${hardest.gainM} m，平均坡度约 ${hardest.avgGradePct}%`,
    });
  }
  return phases;
}

function buildFeel(weather: WeatherSnapshot): HikeBriefFeel {
  const temp = weather.temperatureC ?? 18;
  const precip = weather.precipMm ?? 0;
  const wind = weather.windMs ?? 0;
  const humidity = weather.humidity ?? 50;
  const storm = weather.thunderstormRisk ?? "unknown";

  let sun = "紫外一般，常规防晒即可";
  if (temp >= 28 && precip < 1) sun = "晒，山脊缺少遮挡，帽子墨镜防晒都要带";
  else if (precip >= 3 || storm === "high") sun = "云雨为主，晒感不强";

  let heat = `气温约 ${Math.round(temp)}°C，体感尚可`;
  if (temp >= 32) heat = `气温约 ${Math.round(temp)}°C，低山中午偏热`;
  else if (temp >= 28) heat = `气温约 ${Math.round(temp)}°C，爬升段会闷热`;
  else if (temp <= 5) heat = `气温约 ${Math.round(temp)}°C，偏冷，注意保暖`;

  let humidityFeel = "干湿适中";
  if (humidity >= 80 || (temp >= 28 && humidity >= 70)) {
    humidityFeel = "偏闷，林下更明显";
  } else if (humidity <= 40) {
    humidityFeel = "较干爽";
  }

  let slip = "路况预期尚可";
  if (precip >= 5 || storm === "high") {
    slip = "降雨后土路/苔石易滑，下坡控速";
  } else if (precip >= 1) {
    slip = "可能有湿滑路段，抓地鞋更稳";
  } else if (wind >= 10) {
    slip = `风力约 ${wind.toFixed(0)} m/s，暴露山脊注意站稳`;
  }

  return { sun, heat, humidity: humidityFeel, slip };
}

function decideVerdict(input: {
  overall: number;
  weather: WeatherSnapshot;
}): { verdict: HikeVerdict; verdictLabel: string } {
  const temp = input.weather.temperatureC ?? 18;
  const precip = input.weather.precipMm ?? 0;
  const storm = input.weather.thunderstormRisk ?? "unknown";
  const band = scoreBand(input.overall);

  if (
    storm === "high" ||
    band === "不建议" ||
    (precip >= 10 && input.overall >= 55)
  ) {
    return { verdict: "nogo", verdictLabel: "不建议上山" };
  }
  if (
    storm === "medium" ||
    band === "很难" ||
    precip >= 5 ||
    temp >= 33 ||
    input.overall >= 72
  ) {
    return { verdict: "caution", verdictLabel: "谨慎上山" };
  }
  if (precip < 1 && storm === "low" && input.overall < 55 && temp < 30) {
    return { verdict: "go", verdictLabel: "放心冲" };
  }
  return { verdict: "go", verdictLabel: "宜上山" };
}

export function buildHikeBrief(input: {
  title?: string;
  route: RouteSummary;
  segments: Segment[];
  weather: WeatherSnapshot;
  focus: DifficultyScores;
  duration: { lowMin: number; highMin: number };
  mainRisk?: string;
  suggestedStartLabel?: string;
  finishWindow?: string;
}): HikeBrief {
  const hardest = findHardestStretch(input.segments);
  const { verdict, verdictLabel } = decideVerdict({
    overall: input.focus.overall,
    weather: input.weather,
  });
  const band = scoreBand(input.focus.overall);
  const temp = input.weather.temperatureC ?? 18;
  const precip = input.weather.precipMm ?? 0;
  const storm = input.weather.thunderstormRisk ?? "unknown";

  const whyParts: string[] = [];
  if (storm === "high") whyParts.push("雷暴风险偏高");
  else if (storm === "medium") whyParts.push("对流可能增强");
  if (precip >= 5) whyParts.push(`降水约 ${precip.toFixed(1)} mm`);
  else if (precip >= 1) whyParts.push("可能有零星降水");
  else whyParts.push("系统性降水不明显");
  if (temp >= 30) whyParts.push("气温偏高");
  whyParts.push(`路线负荷 ${input.focus.overall}/100（${band}）`);
  if (hardest) {
    whyParts.push(
      `关键难在 ${hardest.startKm.toFixed(1)}–${hardest.endKm.toFixed(1)} km`,
    );
  }
  const why = whyParts.join("；") + "。";

  const name = input.title?.trim() || "这条线";
  const headline =
    verdict === "nogo"
      ? `${name}｜${verdictLabel}。${input.route.distanceKm.toFixed(1)} km / +${input.route.elevationGainM} m`
      : verdict === "caution"
        ? `${name}｜${verdictLabel}，可走成熟线。${input.route.distanceKm.toFixed(1)} km / +${input.route.elevationGainM} m`
        : `${name}｜${verdictLabel}。${input.route.distanceKm.toFixed(1)} km / +${input.route.elevationGainM} m · 对你约 ${input.focus.overall}/100（${band}）`;

  const phases = buildPhases(input.segments, hardest);
  const feel = buildFeel(input.weather);

  const actions: string[] = [];
  if (verdict === "nogo") {
    actions.push("改期或改低山公园；不要赌午后对流。");
  } else {
    if (input.suggestedStartLabel && input.suggestedStartLabel !== "—") {
      actions.push(
        `建议 ${input.suggestedStartLabel} 出发，完成窗口 ${input.finishWindow ?? "见报告"}。`,
      );
    }
    if (hardest) {
      actions.push(
        `把体力留给 ${hardest.startKm.toFixed(1)}–${hardest.endKm.toFixed(1)} km，前半段别开太快。`,
      );
    }
    if (temp >= 28) actions.push("补水加防晒，爬升段主动降速。");
    else if (precip >= 1) actions.push("带雨具，下坡控速。");
    else actions.push("均匀配速即可，留意后程疲劳。");
  }
  if (input.mainRisk) {
    actions.push(`主风险：${input.mainRisk}。`);
  }

  const copyLines = [
    headline,
    "",
    `为什么：${why}`,
    "",
    "分段：",
    ...phases.map((p) => `· ${p.label}：${p.detail}`),
    "",
    "体感：",
    `· 晒：${feel.sun}`,
    `· 热：${feel.heat}`,
    `· 闷：${feel.humidity}`,
    `· 路：${feel.slip}`,
    "",
    `预估 ${formatDuration(input.duration.lowMin)}–${formatDuration(input.duration.highMin)}（行进向）`,
    ...actions.map((a, i) => `${i + 1}. ${a}`),
  ];

  return {
    verdict,
    verdictLabel,
    headline,
    why,
    phases,
    feel,
    actions: actions.slice(0, 4),
    copyText: copyLines.join("\n"),
  };
}
