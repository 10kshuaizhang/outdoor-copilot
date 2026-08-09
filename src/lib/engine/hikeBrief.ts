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

function precipLabel(mm: number): string {
  if (mm < 0.2) return "基本无雨";
  if (mm < 2) return "零星小雨";
  if (mm < 10) return "小到中雨";
  if (mm < 25) return "中雨（短时可能偏强）";
  return "大雨/强降水风险";
}

function stormLabel(
  risk: WeatherSnapshot["thunderstormRisk"],
): { level: string; detail: string } {
  if (risk === "high") {
    return {
      level: "高风险",
      detail: "可能伴随闪电、短时强降水、突发阵风；不适合赌午后窗口。",
    };
  }
  if (risk === "medium") {
    return {
      level: "中风险",
      detail: "午后对流可能发展，阵雨/雷阵雨较分散，山脊阵风可能突然增强。",
    };
  }
  if (risk === "low") {
    return {
      level: "低",
      detail: "系统性强对流不明显，但仍要看天变。",
    };
  }
  return {
    level: "不确定",
    detail: "对流信息不足，按保守预期准备。",
  };
}

function phaseEffortSummary(segs: Segment[]): string {
  if (segs.length === 0) return "数据不足";
  const gain = Math.round(segs.reduce((s, x) => s + x.gainM, 0));
  const loss = Math.round(segs.reduce((s, x) => s + x.lossM, 0));
  const labels = segs.map((s) => s.effortLabel);
  const hard = labels.filter((l) => l === "hard_climb").length;
  const descent = labels.filter((l) => l === "descent").length;
  if (hard >= Math.max(1, Math.floor(segs.length * 0.35))) {
    return `陡升偏多，累计爬升约 ${gain} m；雨后这里挑战会明显变大`;
  }
  if (descent >= Math.max(1, Math.floor(segs.length * 0.4)) && loss > gain) {
    return `下坡为主，累计下降约 ${loss} m；湿滑时下山风险高于上山`;
  }
  if (gain >= 120) return `爬升约 ${gain} m，节奏放稳`;
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
      detail: `${effortLabelZh(hardest.label)}，爬升约 ${hardest.gainM} m，平均坡度约 ${hardest.avgGradePct}%；阵雨后这段下山/通过要特别小心`,
    });
  }
  return phases;
}

function buildWeatherBlocks(input: {
  weather: WeatherSnapshot;
  route: RouteSummary;
}): HikeBriefPhase[] {
  const temp = input.weather.temperatureC ?? 18;
  const tempMin = input.weather.temperatureMinC;
  const precip = input.weather.precipMm ?? 0;
  const wind = input.weather.windMs ?? 0;
  const humidity = input.weather.humidity ?? 50;
  const storm = stormLabel(input.weather.thunderstormRisk);
  const elevSpan = Math.max(
    0,
    input.route.maxElevM - input.route.minElevM,
  );
  const ridgeApprox = Math.round(temp - (elevSpan / 100) * 0.55);
  const valleyHigh = Math.round(temp);
  const valleyLow = Math.round(tempMin ?? temp - 6);

  let rainDetail =
    precip < 0.2
      ? "系统性降水不明显；山区仍可能有局地飘雨。"
      : precip < 10
        ? `预计降水约 ${precip.toFixed(1)} mm（${precipLabel(precip)}）。更像分散性阵雨，不是下整天；但仍会把土路/苔石打湿。`
        : `预计降水约 ${precip.toFixed(1)} mm（${precipLabel(precip)}）。短时可能偏强，沟谷涨水、冲刷和下山难度都会上去。`;
  if (input.weather.rainWindow) {
    rainDetail += ` ${input.weather.rainWindow}。`;
  }
  if (input.weather.peakHourPrecipMm != null && input.weather.peakHourPrecipMm >= 1) {
    rainDetail += ` 小时峰值约 ${input.weather.peakHourPrecipMm} mm。`;
  }

  const windBeaufortish =
    wind < 3
      ? "约1–2级，整体不大"
      : wind < 6
        ? "约3级左右"
        : wind < 10
          ? "约4级，山脊更明显"
          : "偏大，垭口/山脊阵风需小心";

  const uvIdx = input.weather.uvIndexMax;
  const uv =
    precip >= 5 || input.weather.thunderstormRisk === "high"
      ? "云雨为主，晒感不强，但仍建议常规防晒"
      : uvIdx != null
        ? `紫外线指数约 ${uvIdx}，${uvIdx >= 7 ? "偏强，山脊缺遮挡务必防晒" : "中等，建议常规防晒"}`
        : temp >= 28
          ? "紫外偏强，山脊缺遮挡，帽子墨镜防晒霜都要"
          : "紫外中等偏强，云天也建议防晒";

  const blocks: HikeBriefPhase[] = [
    { label: "降雨", detail: rainDetail },
    { label: "对流/雷暴", detail: `${storm.level}。${storm.detail}` },
    {
      label: "风力",
      detail: `平均风${windBeaufortish}（约 ${wind.toFixed(1)} m/s）；雷雨云靠近时山脊阵风可能突然增强。`,
    },
    {
      label: "温度",
      detail: `谷地/低段约 ${valleyLow}–${valleyHigh}℃；高差较大时山脊大约 ${Math.min(ridgeApprox, valleyHigh) - 2}–${Math.max(ridgeApprox, valleyLow) + 2}℃（粗估）。`,
    },
    {
      label: "闷热与湿度",
      detail:
        humidity >= 75 || (temp >= 28 && humidity >= 65)
          ? `湿度约 ${Math.round(humidity)}%，偏闷，林下更明显。`
          : `湿度约 ${Math.round(humidity)}%，整体不算特别闷。`,
    },
    { label: "紫外线", detail: uv },
  ];

  if (input.weather.modelAgreement?.summary) {
    blocks.unshift({
      label: "多模型",
      detail: input.weather.modelAgreement.summary,
    });
  }

  return blocks;
}

function buildClothing(weather: WeatherSnapshot, route: RouteSummary): string[] {
  const temp = weather.temperatureC ?? 18;
  const tempMin = weather.temperatureMinC ?? temp - 5;
  const precip = weather.precipMm ?? 0;
  const wind = weather.windMs ?? 0;
  const ridge = Math.round(temp - Math.max(0, route.maxElevM - route.minElevM) / 100 * 0.55);
  const items: string[] = [];

  if (temp >= 30) {
    items.push("短袖速干 + 薄防晒衣；避免棉质吸汗不干。");
  } else if (temp >= 22) {
    items.push("短袖/薄长袖速干；山脊风大时加一件薄外套。");
  } else if (temp >= 12) {
    items.push("长袖速干 + 薄抓绒；早晚偏凉可备轻羽绒/棉服。");
  } else {
    items.push("抓绒 + 防风壳；低温时加保暖层，手套帽子备上。");
  }

  if (ridge <= 12 || tempMin <= 10) {
    items.push(`高处体感可能到 ${ridge}℃ 上下，多带一层比少带稳。`);
  }
  if (precip >= 1 || weather.thunderstormRisk === "medium" || weather.thunderstormRisk === "high") {
    items.push("外套优先选防泼水/冲锋衣，内层保持速干。");
  }
  if (wind >= 8) {
    items.push("防风层很重要，山脊停下来会明显降温。");
  }
  items.push("鞋子：防滑徒步鞋；雨后优先深纹鞋底。");
  return items.slice(0, 4);
}

function buildGear(weather: WeatherSnapshot, focusOverall: number): string[] {
  const precip = weather.precipMm ?? 0;
  const storm = weather.thunderstormRisk ?? "unknown";
  const temp = weather.temperatureC ?? 18;
  const gear: string[] = ["足够饮水", "能量食物", "导航/离线地图", "头灯（防拖延）"];

  if (precip >= 0.5 || storm === "medium" || storm === "high") {
    gear.push("雨衣或硬壳", "背包防雨罩", "防水袋保护手机");
  }
  if (temp >= 28 || (weather.uvIndexMax ?? 0) >= 7) {
    gear.push("防晒霜", "帽檐帽", "墨镜");
  }
  if (focusOverall >= 65 || precip >= 5) {
    gear.push("备用袜子", "护膝（可选，长下坡有用）");
  }
  if (storm === "high") {
    gear.push("避免金属登山杖在暴露雷雨山脊久留");
  }
  // unique preserve order
  return [...new Set(gear)].slice(0, 8);
}

function buildPhotoTips(weather: WeatherSnapshot): string[] {
  const precip = weather.precipMm ?? 0;
  const cloud = weather.cloudCoverPct;
  const vis = weather.visibilityKm;
  const tips: string[] = [];

  if (precip >= 8 || weather.thunderstormRisk === "high") {
    tips.push("强降水/对流日：远景出片差，优先拍局部雨雾、云瀑；注意设备防水。");
  } else if (precip >= 1) {
    tips.push("阵雨间隙常有云雾翻山，短窗出片；雨停后1–2小时植被颜色更饱和。");
  } else if (cloud != null && cloud >= 70) {
    tips.push("云量偏高：适合拍云海/软光人像，硬光大景机会少。");
  } else {
    tips.push("晴到多云：远景通透机会高；顶光硬时避开正午，侧光更好看。");
  }

  if (vis != null) {
    tips.push(
      vis >= 15
        ? `能见度约 ${vis} km，适合大远景。`
        : vis >= 8
          ? `能见度约 ${vis} km，中景可用，远山可能发灰。`
          : `能见度约 ${vis} km，偏糊，别强求大远景。`,
    );
  } else {
    tips.push("能见度数据不足；雨后更通透，沙尘/高湿日远景易发雾。");
  }

  tips.push("经验窗口：上午云雾、傍晚侧光；正午多留给赶路。");
  return tips.slice(0, 4);
}

function buildFeel(
  weather: WeatherSnapshot,
  route: RouteSummary,
): HikeBriefFeel {
  const blocks = buildWeatherBlocks({ weather, route });
  const by = Object.fromEntries(blocks.map((b) => [b.label, b.detail]));
  return {
    sun: by["紫外线"] ?? "常规防晒",
    heat: by["温度"] ?? "体感见预报",
    humidity: by["闷热与湿度"] ?? "干湿一般",
    slip:
      (weather.precipMm ?? 0) >= 1 ||
      weather.thunderstormRisk === "medium" ||
      weather.thunderstormRisk === "high"
        ? "降雨/阵雨后土路、草甸、苔石易滑；下大坡控速，预期拉低"
        : "路况预期尚可，但仍看现场",
  };
}

function decideVerdict(input: {
  overall: number;
  weather: WeatherSnapshot;
}): {
  verdict: HikeVerdict;
  verdictLabel: string;
  novice: string;
  experienced: string;
} {
  const temp = input.weather.temperatureC ?? 18;
  const precip = input.weather.precipMm ?? 0;
  const storm = input.weather.thunderstormRisk ?? "unknown";
  const band = scoreBand(input.overall);

  if (storm === "high" || precip >= 15 || band === "不建议") {
    return {
      verdict: "nogo",
      verdictLabel: "新手不宜",
      novice: "新手不建议进山，改期或改低山公园。",
      experienced: "老驴也不建议硬冲长线/暴露山脊；装备再好也要把安全放第一。",
    };
  }

  if (
    storm === "medium" ||
    precip >= 5 ||
    band === "很难" ||
    temp >= 33 ||
    input.overall >= 72
  ) {
    return {
      verdict: "caution",
      verdictLabel: precip >= 5 || storm === "medium" ? "新手不宜" : "谨慎上山",
      novice: "新手不建议冲了；经验不足别赌午后对流和湿滑下山。",
      experienced:
        "老驴可以谨慎冲成熟线，雨具、抓地鞋带好，预期拉低；有撤退口更稳。",
    };
  }

  if (precip >= 1 || storm === "unknown") {
    return {
      verdict: "caution",
      verdictLabel: "谨慎上山",
      novice: "新手选成熟短线，避开长暴露山脊；带雨具。",
      experienced: "老驴可冲，但把完成窗口往前压，注意湿滑下坡。",
    };
  }

  if (input.overall < 52 && temp < 30 && precip < 0.5 && storm === "low") {
    return {
      verdict: "go",
      verdictLabel: "放心冲",
      novice: "新手可走成熟线，仍要防晒补水。",
      experienced: "老驴可以冲，体感窗口不错。",
    };
  }

  return {
    verdict: "go",
    verdictLabel: "宜上山",
    novice: "新手可以上，优先成熟路线，别赶速度。",
    experienced: "老驴可冲，注意后程疲劳与补水。",
  };
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
  const decided = decideVerdict({
    overall: input.focus.overall,
    weather: input.weather,
  });
  const { verdict, verdictLabel } = decided;
  const band = scoreBand(input.focus.overall);
  const precip = input.weather.precipMm ?? 0;
  const storm = input.weather.thunderstormRisk ?? "unknown";
  const name = input.title?.trim() || "这条线";
  const day = input.weather.date ?? "";

  const weatherBlocks = buildWeatherBlocks({
    weather: input.weather,
    route: input.route,
  });
  const feel = buildFeel(input.weather, input.route);
  const phases = buildPhases(input.segments, hardest);
  const clothing = buildClothing(input.weather, input.route);
  const gear = buildGear(input.weather, input.focus.overall);
  const photoTips = buildPhotoTips(input.weather);

  const leadParts: string[] = [];
  if (input.weather.modelAgreement?.summary) {
    leadParts.push(input.weather.modelAgreement.summary);
  }
  if (storm === "high" || precip >= 10) {
    leadParts.push(
      `今天这条线对应点预报：${precipLabel(precip)}，对流${stormLabel(storm).level}。`,
    );
  } else if (precip >= 1 || storm === "medium") {
    leadParts.push(
      `预报有阵雨/对流扰动（约 ${precip.toFixed(1)} mm），差异往往在开始时间；不是一定下整天，但会把路打湿。`,
    );
  } else {
    leadParts.push("系统性降水不明显，体感主要看晒、热和路线本身负荷。");
  }
  leadParts.push(
    `${name}约 ${input.route.distanceKm.toFixed(1)} km / +${input.route.elevationGainM} m，对你约 ${input.focus.overall}/100（${band}）。`,
  );

  const whyBits: string[] = [
    precipLabel(precip),
    `对流${stormLabel(storm).level}`,
    `负荷 ${input.focus.overall}/100（${band}）`,
  ];
  if (hardest) {
    whyBits.push(
      `最难 ${hardest.startKm.toFixed(1)}–${hardest.endKm.toFixed(1)} km`,
    );
  }
  const why = whyBits.join("；") + "。";

  const titleBit = day ? `${name}户外天气` : `${name}户外简报`;
  const headline = `${titleBit}｜${verdictLabel}`;

  const actions: string[] = [];
  actions.push(`结论：${decided.novice}`);
  actions.push(`老驴视角：${decided.experienced}`);
  if (input.suggestedStartLabel && input.suggestedStartLabel !== "—") {
    actions.push(
      `若仍出发：建议 ${input.suggestedStartLabel} 走，完成窗口 ${input.finishWindow ?? "见报告"}；预估 ${formatDuration(input.duration.lowMin)}–${formatDuration(input.duration.highMin)}（行进向）。`,
    );
  }
  if (hardest) {
    actions.push(
      `阵雨后 ${hardest.startKm.toFixed(1)}–${hardest.endKm.toFixed(1)} km 及后段下山可能明显变难，预期拉低。`,
    );
  }
  if (input.mainRisk) actions.push(`主风险：${input.mainRisk}。`);

  const copyLines = [
    headline,
    leadParts.join(""),
    "",
    ...weatherBlocks.flatMap((b) => [b.label, b.detail, ""]),
    "穿衣",
    ...clothing.map((c) => `· ${c}`),
    "",
    "装备",
    ...gear.map((g) => `· ${g}`),
    "",
    "出片",
    ...photoTips.map((p) => `· ${p}`),
    "",
    "路线分段",
    ...phases.map((p) => `· ${p.label}：${p.detail}`),
    "",
    "整体判断",
    `· 新手：${decided.novice}`,
    `· 老驴：${decided.experienced}`,
    "",
    "行动",
    ...actions.slice(2).map((a, i) => `${i + 1}. ${a}`),
  ].filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""));

  return {
    verdict,
    verdictLabel,
    headline,
    lead: leadParts.join(""),
    why,
    weatherBlocks,
    audience: {
      novice: decided.novice,
      experienced: decided.experienced,
    },
    phases,
    feel,
    clothing,
    gear,
    photoTips,
    actions: actions.slice(0, 5),
    copyText: copyLines.join("\n"),
    copySource: "template",
  };
}
