import { NextResponse } from "next/server";
import {
  autocompleteAddresses,
  isDemoModeEnabled,
  normalizeQuery,
  type AutocompleteSuggestion,
} from "@/lib/airnodehub";
import {
  checkRateLimit,
  getCachedValue,
  setCachedValue,
} from "@/lib/storage";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
} as const;

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q") || "";
  const query = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim();

  if (query.length < 2 || query.length > 120) {
    return NextResponse.json(
      { suggestions: [] },
      { status: 200, headers: SECURITY_HEADERS }
    );
  }

  const demoMode = isDemoModeEnabled();
  const cacheKey = `ac:v1:${demoMode ? "demo" : "live"}:${normalizeQuery(query)}`;

  const cached = await getCachedValue<AutocompleteSuggestion[]>(cacheKey);
  if (cached) {
    return NextResponse.json(
      { suggestions: cached },
      {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          "Cache-Control": "public, max-age=600",
        },
      }
    );
  }

  // Gentle rate limit (120/hr per IP) even though Geoapify autocomplete is free
  const rate = checkRateLimit(`ac:${getClientIp(request)}`, 120);
  if (!rate.allowed) {
    return NextResponse.json(
      { suggestions: [] },
      { status: 429, headers: SECURITY_HEADERS }
    );
  }

  const suggestions = await autocompleteAddresses(query);
  await setCachedValue(cacheKey, suggestions, 60 * 10); // 10 min TTL

  return NextResponse.json(
    { suggestions },
    {
      status: 200,
      headers: {
        ...SECURITY_HEADERS,
        "Cache-Control": "public, max-age=600",
      },
    }
  );
}
