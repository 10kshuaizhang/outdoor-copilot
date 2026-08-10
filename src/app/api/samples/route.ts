import { NextResponse } from "next/server";
import { listPublicSamples } from "@/lib/samples/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const samples = await listPublicSamples();
    return NextResponse.json(samples);
  } catch (err) {
    const message = err instanceof Error ? err.message : "list failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
