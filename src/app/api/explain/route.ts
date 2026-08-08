import { NextRequest, NextResponse } from "next/server";

type ExplainBody = {
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
    explanation?: { text?: string };
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
    analysis.challenges?.map((c) => c.title).join("；") || "关注连续爬升与后程疲劳";
  return `这条约 ${dist} km、爬升约 ${gain} m 的路线，对你大约是 ${personal}/100（基础 ${base}）。原因包括：${why}。需要留意：${challenge}。建议完成窗口 ${analysis.recommendation?.finishWindow ?? "见报告"}，主风险：${analysis.recommendation?.mainRisk ?? "后程疲劳"}。`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExplainBody;
  const analysis = body.analysis;
  if (!analysis) {
    return NextResponse.json({ error: "analysis required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json(
      { error: "LLM unavailable", text: templateText(analysis), source: "template" },
      { status: 503 },
    );
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
              "你是 Outdoor Copilot 的解释器。只能用用户提供的 JSON 中的数字与路段解释结果，禁止改写分数、时长或发明公里段。用简洁中文。",
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
    if (!res.ok) throw new Error("llm failed");
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
    });
  }
}
