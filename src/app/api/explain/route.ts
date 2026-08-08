import { NextRequest, NextResponse } from "next/server";

type HardestPayload = {
  startKm?: number;
  endKm?: number;
  estimatedEffort?: number;
  peakEffort?: number;
  avgGradePct?: number;
  gainM?: number;
  label?: string;
  peakSegment?: {
    startKm?: number;
    endKm?: number;
    distanceM?: number;
    gainM?: number;
    lossM?: number;
    avgGradePct?: number;
    maxGradePct?: number;
    estimatedEffort?: number;
    effortLabel?: string;
  };
};

type ExplainBody = {
  mode?: "overview" | "hardest_segment";
  hardest?: HardestPayload;
  analysis?: {
    route?: { distanceKm?: number; elevationGainM?: number };
    baseDifficulty?: { overall?: number };
    personalDifficulty?: { overall?: number };
    band?: string;
    contributions?: Array<{ label: string; delta: number }>;
    challenges?: Array<{ title: string }>;
    recommendation?: {
      suggestedStart?: string;
      finishWindow?: string;
      mainRisk?: string;
      waterLiters?: number;
    };
    explanation?: { text: string };
  };
};

function templateText(analysis: NonNullable<ExplainBody["analysis"]>): string {
  const dist = analysis.route?.distanceKm?.toFixed(1) ?? "?";
  const gain = analysis.route?.elevationGainM ?? "?";
  const personal = analysis.personalDifficulty?.overall ?? "?";
  const base = analysis.baseDifficulty?.overall ?? "?";
  const why =
    analysis.contributions
      ?.slice(0, 4)
      .map((c) => `${c.label}（${c.delta > 0 ? "+" : ""}${c.delta}）`)
      .join("；") || "负荷主要来自距离与爬升结构";
  const challenge =
    analysis.challenges?.map((c) => c.title).join("；") ||
    "关注连续爬升与后程疲劳";
  return `这条约 ${dist} km、爬升约 ${gain} m 的路线，对你大约是 ${personal}/100（基础 ${base}）。原因包括：${why}。需要留意：${challenge}。建议完成窗口 ${analysis.recommendation?.finishWindow ?? "见报告"}，主风险：${analysis.recommendation?.mainRisk ?? "后程疲劳"}。`;
}

function hardestTemplate(hardest: HardestPayload): string {
  const start = hardest.startKm?.toFixed(1) ?? "?";
  const end = hardest.endKm?.toFixed(1) ?? "?";
  const gain = hardest.gainM ?? "?";
  const grade = hardest.avgGradePct ?? "?";
  const effort = hardest.estimatedEffort ?? "?";
  const peak = hardest.peakSegment;
  const peakGrade = peak?.maxGradePct ?? grade;
  return `真正难的是 ${start}–${end} km。该段累计爬升约 ${gain} m，平均坡度约 ${grade}%，峰值坡度约 ${peakGrade}%，相对负荷 ${effort}。把体力留给这一段，前后可匀速通过。`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExplainBody;
  const mode = body.mode ?? "overview";

  if (mode === "hardest_segment") {
    const hardest = body.hardest;
    if (!hardest) {
      return NextResponse.json({ error: "hardest required" }, { status: 400 });
    }
    return explainHardest(hardest);
  }

  const analysis = body.analysis;
  if (!analysis) {
    return NextResponse.json({ error: "analysis required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json({
      text: templateText(analysis),
      source: "template",
      reason: "missing_openai_api_key",
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "你是 Outdoor Copilot 的解释器。只能用用户提供的 JSON 中的数字与路段解释结果，禁止改写分数、时长或发明公里段。用简洁中文短段落；可用换行和「1. 2. 3.」列表。不要使用 Markdown（不要 **、#、```、HTML）。",
          },
          {
            role: "user",
            content: JSON.stringify(analysis),
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`llm ${res.status} ${errBody.slice(0, 120)}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("empty");
    return NextResponse.json({ text, model, source: "llm" });
  } catch {
    return NextResponse.json({
      text: templateText(analysis),
      source: "template",
      reason: "llm_request_failed",
    });
  }
}

async function explainHardest(hardest: HardestPayload) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const fallback = hardestTemplate(hardest);

  if (!apiKey) {
    return NextResponse.json({
      text: fallback,
      source: "template",
      reason: "missing_openai_api_key",
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "你是 Outdoor Copilot 的路段解释器。用户只给你「最难一段」的结构化数字。只用这些数字解释为什么该段最难、徒步时该怎么分配体力。禁止改写或发明分数、公里、爬升、坡度、负荷数字。2–4 句简洁中文。不要 Markdown。",
          },
          {
            role: "user",
            content: JSON.stringify(hardest),
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`llm ${res.status}`);
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("empty");
    return NextResponse.json({ text, model, source: "llm" });
  } catch {
    return NextResponse.json({
      text: fallback,
      source: "template",
      reason: "llm_request_failed",
    });
  }
}
