import { NextResponse } from "next/server";
import {
  isAdminConfigured,
  requireAdminSession,
} from "@/lib/samples/auth";
import { samplesStorageInfo } from "@/lib/samples/store";

export const runtime = "nodejs";

export async function GET() {
  const configured = isAdminConfigured();
  const authed = configured ? await requireAdminSession() : false;
  const storage = await samplesStorageInfo();
  return NextResponse.json({
    configured,
    authed,
    storage,
  });
}
