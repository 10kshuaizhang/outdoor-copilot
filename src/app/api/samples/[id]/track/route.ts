import { NextRequest, NextResponse } from "next/server";
import { readSampleTrack } from "@/lib/samples/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const track = await readSampleTrack(id);
  if (!track) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const type =
    track.format === "kml"
      ? "application/vnd.google-earth.kml+xml; charset=utf-8"
      : "application/gpx+xml; charset=utf-8";
  return new NextResponse(track.xml, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=60",
      "Content-Disposition": `inline; filename="${track.filename}"`,
    },
  });
}
