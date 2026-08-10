import { NextRequest, NextResponse } from "next/server";
import {
  adminCookieOptions,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from "@/lib/samples/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "未配置 ADMIN_PASSWORD，无法登录管理后台。" },
      { status: 503 },
    );
  }
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password ?? "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }
  const token = createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  const opts = adminCookieOptions(token);
  res.cookies.set(opts);
  return res;
}
