import { NextResponse } from "next/server";
import {
  fetchLiveOpenMeteoDataset,
  geocodeLiveLocation,
  isDemoModeEnabled,
  normalizeQuery,
  resolveDemoLocation,
  type SolarLocationDataset,
} from "@/lib/airnodehub";
import { DEFAULT_SYSTEM_CONFIG, runSolarAudit } from "@/lib/solar";
import {
  buildSolarGridKey,
  checkRateLimit,
  getCachedValue,
  setCachedValue,
} from "@/lib/storage";

interface SolarAuditApiResponse {
  dataset: SolarLocationDataset;
  defaultAudit: ReturnType<typeof runSolarAudit>;
  cached: boolean;
  mode: "demo" | "live";
}

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

function sanitizeClientError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Could not read sunlight data for that address.";
  }
  const msg = err.message;
  // Never leak keys, stack traces, or internal details
  if (/0x[0-9a-fA-F]{64}/.test(msg)) {
    return "Server wallet signing configuration error.";
  }
  if (msg.includes("abort")) {
    return "The sunlight data provider took too long to respond. Please try again.";
  }
  return msg.slice(0, 220);
}

async function handleSolarAudit(query: string, request: Request) {
  const trimmed = query.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!trimmed || trimmed.length > 200) {
    return NextResponse.json(
      { error: "Please enter a valid address, neighborhood, or city name." },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  const demoMode = isDemoModeEnabled();
  const normalizedQ = normalizeQuery(trimmed);
  const queryCacheKey = `query:v1:${demoMode ? "demo" : "live"}:${normalizedQ}`;

  // 1. Check query cache first ($0 cost, zero rate-limit penalty on cache hits)
  const queryHit = await getCachedValue<SolarLocationDataset>(queryCacheKey);
  if (queryHit) {
    const defaultAudit = runSolarAudit(
      queryHit.days,
      queryHit.location.lat,
      DEFAULT_SYSTEM_CONFIG
    );
    const payload: SolarAuditApiResponse = {
      dataset: queryHit,
      defaultAudit,
      cached: true,
      mode: queryHit.mode,
    };
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        ...SECURITY_HEADERS,
        "Cache-Control": "public, max-age=3600",
        "X-Roofwatt-Mode": queryHit.mode,
        "X-Roofwatt-Cache": "HIT",
      },
    });
  }

  // 2. Enforce gentle IP rate limit (15/hr) + isolate-wide global budget guard (40/hr)
  if (!demoMode) {
    const rate = checkRateLimit(getClientIp(request));
    const globalGuard = checkRateLimit("__global_live_budget__", 40);
    if (!rate.allowed || !globalGuard.allowed) {
      return NextResponse.json(
        {
          error:
            "You have explored quite a few new locations this hour. Please wait a bit before trying another address.",
          resetAt: !rate.allowed ? rate.resetAt : globalGuard.resetAt,
        },
        { status: 429, headers: SECURITY_HEADERS }
      );
    }
  }

  try {
    let dataset: SolarLocationDataset;
    let cached = false;
    let gridKey = "";

    if (demoMode) {
      dataset = resolveDemoLocation(trimmed);
      gridKey = buildSolarGridKey(dataset.location.lat, dataset.location.lon);
      await setCachedValue(queryCacheKey, dataset);
    } else {
      // Step A: Free Geoapify Airnode geocode ($0.00)
      const { location, attestation: geoAttestation } =
        await geocodeLiveLocation(trimmed);

      // Step B: Check ~2 km geohash cache BEFORE spending $0.10 aUSD on Open-Meteo
      gridKey = buildSolarGridKey(location.lat, location.lon);
      const gridHit = await getCachedValue<SolarLocationDataset>(gridKey);

      if (gridHit) {
        cached = true;
        // Preserve the user's exact geocoded display location & free geocode proof
        // while reusing cached 365-day weather for the same ~2 km grid!
        dataset = {
          ...gridHit,
          location: {
            ...location,
            elevationM: gridHit.location.elevationM,
            timezone: gridHit.location.timezone || location.timezone,
          },
          attestations: {
            geocode: geoAttestation,
            weather: gridHit.attestations.weather,
          },
        };
      } else {
        // Step C: Paid Open-Meteo Airnode historicalWeather ($0.10 aUSD x402)
        dataset = await fetchLiveOpenMeteoDataset(location, geoAttestation);
        await setCachedValue(gridKey, dataset);
      }

      await setCachedValue(queryCacheKey, dataset);
    }

    const defaultAudit = runSolarAudit(
      dataset.days,
      dataset.location.lat,
      DEFAULT_SYSTEM_CONFIG
    );

    const payload: SolarAuditApiResponse = {
      dataset,
      defaultAudit,
      cached,
      mode: dataset.mode,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        ...SECURITY_HEADERS,
        "Cache-Control": demoMode
          ? "public, max-age=3600"
          : "public, max-age=1800",
        "X-Roofwatt-Mode": dataset.mode,
        "X-Roofwatt-Cache": cached ? "HIT" : "MISS",
        "X-Roofwatt-Grid": gridKey,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: sanitizeClientError(err) },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query =
    searchParams.get("q") ||
    searchParams.get("slug") ||
    searchParams.get("address") ||
    "";
  return handleSolarAudit(query, request);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string; address?: string };
    const query = body.query || body.address || "";
    return handleSolarAudit(query, request);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }
}
