import { NextRequest, NextResponse } from "next/server";
import { clampXhsText, xhsPolishTargetChars } from "@/lib/share/xhsLimit";

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

type BriefPolishPayload = {
  copyText?: string;
  title?: string;
  maxChars?: number;
  brief?: Record<string, unknown>;
  route?: { distanceKm?: number; elevationGainM?: number };
  band?: string;
};

/** Accepts both legacy RouteAnalysis-shaped bodies and slim explain payloads. */
type ExplainBody = {
  mode?: "overview" | "hardest_segment" | "brief_polish";
  hardest?: HardestPayload;
  analysis?: Record<string, unknown>;
  brief?: BriefPolishPayload;
};

const BRIEF_POLISH_SYSTEM = `你是 Outdoor Copilot 的小红书文案润色器，面向中国大陆徒步用户。

硬规则：
1. 只能润色措辞与段落节奏。禁止改写、发明或省略 JSON / copyText 里的任何数字、结论档位（verdictLabel）、地点、建议时刻、水量、坡度、公里等事实。
2. copyText 是数字与结论的唯一真相来源；结构化 brief 用于组织章节。
3. 输出一篇可直接发小红书的「天气决策帖」：结论开头 → 天气分项 → 新手/老驴 → 穿衣/装备/出片 → 分段 → 行动。
4. 简洁中文，可用换行与「1. 2. 3.」。不要 Markdown（不要 **、#、\`\`\`、HTML）。不要话题标签（客户端会追加）。
5. 语气像户外决策博主：先给能不能去，再讲为什么；少废话。
6. 【字数硬限制】正文总字数（含标点与换行）必须 ≤ maxChars（见用户 JSON）。宁可删减穿衣/出片/分段细节，也禁止超限。写完自行默数；超了就压缩后再输出。`;

const OVERVIEW_SYSTEM = `你是 Outdoor Copilot 的解释器，面向中国大陆徒步用户。

硬规则：
1. 只能使用用户 JSON 里已有的数字与字段，禁止改写分数、档位、公里、爬升、时长、出发/完成时刻。
2. 时间只准使用 recommendation.suggestedStartLocal 与 finishWindowLocal（已是北京时间 HH:mm）。禁止把任何 ISO/UTC 字符串自行换算成另一套时间；没有这两个字段就写「见报告」，不要编造时刻。
3. duration 是「行进向」估计。可以提醒：含长时间观景/用餐会更久，但不要改 JSON 里的分钟数。
4. 难度档位必须与 scores.band 一致（例如 band 是「轻松」就不要写成「适中」）。
5. 主风险只用 recommendation.mainRisk；不要额外发明「天黑/雷暴」等风险。
6. 用简洁中文；可用换行和「1. 2. 3.」列表。不要 Markdown（不要 **、#、\`\`\`、HTML）。

结构建议：路线概况 → 主要挑战/最难段 → 分段要点（若有 hardestStretch）→ 天气与行动建议。`;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function templateText(analysis: Record<string, unknown>): string {
  const route = asRecord(analysis.route);
  const scores = asRecord(analysis.scores);
  const legacyPersonal = asRecord(analysis.personalDifficulty);
  const legacyBase = asRecord(analysis.baseDifficulty);
  const rec = asRecord(analysis.recommendation);
  const duration = asRecord(analysis.duration);

  const dist =
    num(route?.distanceKm)?.toFixed(1) ??
    "?";
  const gain = num(route?.elevationGainM) ?? "?";
  const personal =
    num(scores?.personalOverall) ??
    num(legacyPersonal?.overall) ??
    "?";
  const base =
    num(scores?.baseOverall) ?? num(legacyBase?.overall) ?? "?";
  const band = str(scores?.band) ?? str(analysis.band) ?? "";
  const start =
    str(rec?.suggestedStartLocal) ??
    "见报告";
  const finish =
    str(rec?.finishWindowLocal) ??
    str(rec?.finishWindow) ??
    "见报告";
  const risk = str(rec?.mainRisk) ?? "后程疲劳";
  const water = num(rec?.waterLiters);
  const low = num(duration?.lowMin);
  const high = num(duration?.highMin);

  const contributions = Array.isArray(analysis.contributions)
    ? (analysis.contributions as Array<{ label?: string; delta?: number }>)
        .slice(0, 4)
        .map((c) => `${c.label ?? ""}（${(c.delta ?? 0) > 0 ? "+" : ""}${c.delta ?? 0}）`)
        .filter((s) => s.length > 2)
        .join("；")
    : "";

  const challenges = Array.isArray(analysis.challenges)
    ? (analysis.challenges as Array<{ title?: string }>)
        .map((c) => c.title)
        .filter(Boolean)
        .join("；")
    : "";

  const timeRange =
    low != null && high != null
      ? `行进向预估约 ${low}–${high} 分钟（含长时间观景/用餐会更久）`
      : "行进向预估见报告";

  return `这条约 ${dist} km、爬升约 ${gain} m 的路线，对你大约是 ${personal}/100${band ? `（${band}）` : ""}（基础 ${base}）。${contributions ? `原因包括：${contributions}。` : ""}${challenges ? `需要留意：${challenges}。` : ""}${timeRange}。建议 ${start} 出发，完成窗口 ${finish}${water != null ? `，饮水约 ${water} L` : ""}。主风险：${risk}。`;
}

function hardestTemplate(hardest: HardestPayload): string {
  const start = hardest.startKm?.toFixed(1) ?? "?";
  const end = hardest.endKm?.toFixed(1) ?? "?";
  const gain = hardest.gainM ?? "?";
  const grade = hardest.avgGradePct ?? "?";
  const effort = hardest.estimatedEffort ?? "?";
  const peak = hardest.peakSegment;
  const rawPeak = Number(peak?.maxGradePct ?? grade);
  const peakGrade = Number.isFinite(rawPeak)
    ? Math.min(45, Math.abs(rawPeak)).toFixed(0)
    : "?";
  return `真正难的是 ${start}–${end} km。该段累计爬升约 ${gain} m，平均坡度约 ${grade}%，峰值坡度约 ${peakGrade}%，相对负荷 ${effort}。把体力留给主要爬升段，前后可匀速通过。`;
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

  if (mode === "brief_polish") {
    const brief = body.brief;
    if (!brief?.copyText) {
      return NextResponse.json({ error: "brief.copyText required" }, { status: 400 });
    }
    return polishBrief(brief);
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
        temperature: 0.35,
        messages: [
          { role: "system", content: OVERVIEW_SYSTEM },
          { role: "user", content: JSON.stringify(analysis) },
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

async function polishBrief(brief: BriefPolishPayload) {
  const maxChars =
    typeof brief.maxChars === "number" && brief.maxChars > 0
      ? brief.maxChars
      : xhsPolishTargetChars({
          title: brief.title,
          verdictLabel:
            brief.brief && typeof brief.brief === "object"
              ? String(
                  (brief.brief as { verdictLabel?: string }).verdictLabel ?? "",
                )
              : undefined,
        });
  const fallback = clampXhsText(brief.copyText ?? "", maxChars);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json({
      text: fallback,
      source: "template",
      reason: "missing_openai_api_key",
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
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
          { role: "system", content: BRIEF_POLISH_SYSTEM },
          {
            role: "user",
            content: JSON.stringify({ ...brief, maxChars }),
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
    // Server-side hard clamp — never trust the model on length.
    return NextResponse.json({
      text: clampXhsText(text, maxChars),
      model,
      source: "llm",
    });
  } catch {
    return NextResponse.json({
      text: fallback,
      source: "template",
      reason: "llm_request_failed",
    });
  }
}
