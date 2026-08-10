import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/samples/auth";

/**
 * Runtime capability probe for Outdoor Copilot integrations.
 * Safe to expose: never returns secret values.
 */
export async function GET() {
  const hasLlmKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  let weatherReachable: boolean | "unknown" = "unknown";
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=40.5&longitude=116&daily=temperature_2m_max&timezone=Asia/Shanghai&forecast_days=1";
    const res = await fetch(url, { next: { revalidate: 600 } });
    weatherReachable = res.ok;
  } catch {
    weatherReachable = false;
  }

  return NextResponse.json({
    weather: {
      provider: "open-meteo",
      configured: true,
      reachable: weatherReachable,
      needsUserKey: false,
    },
    llm: {
      provider: "openai-compatible",
      configured: hasLlmKey,
      reachable: hasLlmKey ? "unknown" : false,
      needsUserKey: true,
      model: hasLlmKey ? model : null,
      baseHost: hasLlmKey ? safeHost(baseURL) : null,
    },
    admin: {
      configured: isAdminConfigured(),
      path: "/admin",
    },
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  });
}

function safeHost(baseURL: string): string | null {
  try {
    return new URL(baseURL).host;
  } catch {
    return null;
  }
}
