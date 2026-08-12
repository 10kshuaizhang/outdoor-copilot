import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/samples/auth";
import { extractEditorialDraftFromArticle } from "@/lib/share/extractEditorialDraft";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { article?: string; presetHint?: string };
  try {
    body = (await req.json()) as { article?: string; presetHint?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const article = typeof body.article === "string" ? body.article : "";
  if (!article.trim()) {
    return NextResponse.json({ error: "article required" }, { status: 400 });
  }

  const result = await extractEditorialDraftFromArticle(article, {
    presetHint: body.presetHint,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    source: result.source,
    model: result.model,
    draft: result.draft,
  });
}
