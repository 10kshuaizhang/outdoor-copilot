import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/samples/auth";
import {
  deleteSample,
  publicSampleMeta,
  updateSample,
} from "@/lib/samples/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      let xml: string | undefined;
      if (file instanceof File && file.size > 0) {
        xml = await file.text();
      }
      const record = await updateSample(id, {
        name: optionalString(form.get("name")),
        region: optionalString(form.get("region")),
        blurb: optionalString(form.get("blurb")),
        stats: optionalString(form.get("stats")),
        xml,
      });
      return NextResponse.json({ sample: publicSampleMeta(record) });
    }

    const body = (await req.json()) as {
      name?: string;
      region?: string;
      blurb?: string;
      stats?: string;
    };
    const record = await updateSample(id, body);
    return NextResponse.json({ sample: publicSampleMeta(record) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "update failed";
    const status = message.includes("不存在") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await deleteSample(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "delete failed";
    const status = message.includes("不存在") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

function optionalString(v: FormDataEntryValue | null): string | undefined {
  if (v == null) return undefined;
  const s = String(v);
  return s;
}
