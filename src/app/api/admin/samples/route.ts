import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/samples/auth";
import {
  createSample,
  listSampleRecords,
  publicSampleMeta,
  samplesStorageInfo,
} from "@/lib/samples/store";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [samples, storage] = await Promise.all([
    listSampleRecords(),
    samplesStorageInfo(),
  ]);
  return NextResponse.json({
    samples: samples.map(publicSampleMeta).map((s, i) => ({
      ...s,
      format: samples[i].format,
      updatedAt: samples[i].updatedAt,
      trackFile: samples[i].trackFile,
    })),
    storage,
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const region = String(form.get("region") ?? "").trim();
    const blurb = String(form.get("blurb") ?? "").trim();
    const stats = String(form.get("stats") ?? "").trim();
    const id = String(form.get("id") ?? "").trim();
    const file = form.get("file");

    if (!name || !region || !blurb) {
      return NextResponse.json(
        { error: "名称、地区、简介为必填" },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请上传 GPX / KML 文件" }, { status: 400 });
    }
    const xml = await file.text();
    const record = await createSample({
      id: id || undefined,
      name,
      region,
      blurb,
      stats: stats || undefined,
      xml,
      filenameHint: file.name,
    });
    return NextResponse.json({ sample: publicSampleMeta(record) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
