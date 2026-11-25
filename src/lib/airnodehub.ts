/**
 * API3 AirnodeHub Client + Live x402 v2 EIP-3009 Settlement + DEMO_MODE 5-City Dataset
 *
 * Verified live endpoints from https://airnodehub.api3.org/llms.txt:
 *  - Geoapify Airnode:        https://airnodes.api3.org/geoapify
 *      signer:                0xe02BEaC10Add5037daa0FF6BCACB13360bd4185D
 *      operation `geocode`:   FREE ($0.00) -> GeoJSON FeatureCollection
 *  - Open-Meteo Airnode:      https://airnodes.api3.org/open-meteo
 *      signer:                0xee510FFb986299529fE987bfD163D6c89067D767
 *      operation `historicalWeather`: $0.10 aUSD (Base Sepolia eip155:84532)
 *        daily variables: shortwave_radiation_sum (MJ/m²), cloud_cover_mean (%),
 *                         sunshine_duration (s), daylight_duration (s), temperature_2m_max (°C)
 *  - Visual Crossing Airnode: https://airnodes.api3.org/visualcrossing
 *      signer:                0xc86c050c80474c9756437Ee2026FfF093f20f479
 *      operation `getTimelineRange`: $0.50 aUSD
 */

import type { Address, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  type DailyWeatherRecord,
  normalizeIrradianceToKwhPerM2,
} from "./solar.ts";
import { verifyAirnodeAttestation } from "./verify.ts";

// ============================================================================
// Live AirnodeHub Constants
// ============================================================================

export const AIRNODEHUB_CONFIG = {
  mcpUrl: "https://airnodehub.api3.org/mcp",
  llmsUrl: "https://airnodehub.api3.org/llms.txt",
  faucetUrl: "https://airnodehub.api3.org/faucet",
  payment: {
    x402Version: 2,
    scheme: "exact",
    network: "eip155:84532",
    chainId: 84532,
    asset: "0xbeA34973e5f67F18F656A2C6070C64326C791808",
    symbol: "aUSD",
    decimals: 6,
    payTo: "0x1505FD562AC2Fb4307B85BC6c672FfeafB4d57A7",
    facilitator: "https://facilitator.payai.network",
  },
  geoapify: {
    url: "https://airnodes.api3.org/geoapify",
    passthroughUrl: "https://airnodes.api3.org/geoapify/api/v1/geocode/search",
    address: "0xe02BEaC10Add5037daa0FF6BCACB13360bd4185D",
    operation: "geocode",
    priceUsd: "0.00",
  },
  openMeteo: {
    url: "https://airnodes.api3.org/open-meteo",
    passthroughUrl:
      "https://airnodes.api3.org/open-meteo/api/historical-weather/v1/archive",
    address: "0xee510FFb986299529fE987bfD163D6c89067D767",
    operation: "historicalWeather",
    priceUsd: "0.10",
    dailyVariables:
      "shortwave_radiation_sum,cloud_cover_mean,sunshine_duration,daylight_duration,temperature_2m_max",
  },
  visualCrossing: {
    url: "https://airnodes.api3.org/visualcrossing",
    address: "0xc86c050c80474c9756437Ee2026FfF093f20f479",
    operation: "getTimelineRange",
    priceUsd: "0.50",
  },
} as const;

// ============================================================================
// Exact AirnodeHub Envelope & Upstream Response Schemas
// ============================================================================

export interface AirnodeAttestationEnvelope {
  /** Checksummed EVM address of the signing Airnode */
  airnode: string;
  /** keccak256(utf8(JSON.stringify([operation, canonical(parameters)]))) */
  requestHash: string;
  /** Unix seconds string at signing time */
  timestamp: string;
  /** Exact UTF-8 JSON body returned by the upstream provider */
  data: string;
  /** EIP-191 secp256k1 signature over keccak256(abi.encodePacked(requestHash, timestamp, dataBytes)) */
  signature: string;
}

export interface PaymentReceiptSummary {
  network: string;
  amountUsd: string;
  transaction?: string;
  payer?: string;
  success?: boolean;
}

export interface AttestedCallRecord {
  provider: "Geoapify" | "Open-Meteo";
  endpointUrl: string;
  operation: string;
  parameters: Record<string, string | number | boolean>;
  priceUsd: string;
  mode: "demo" | "live";
  envelope: AirnodeAttestationEnvelope;
  settlement?: PaymentReceiptSummary;
}

export interface GeoapifyFeatureProperties {
  name?: string;
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  county?: string;
  state?: string;
  country: string;
  country_code: string;
  lat: number;
  lon: number;
  result_type?: string;
  timezone?: {
    name: string;
    offset_STD: string;
    offset_DST: string;
    offset_STD_seconds: number;
    offset_DST_seconds: number;
    abbreviation_STD: string;
    abbreviation_DST: string;
  };
}

export interface GeoapifyGeocodeResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: GeoapifyFeatureProperties;
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
  }>;
  query?: {
    text: string;
  };
}

export interface OpenMeteoHistoricalDailyResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  daily_units: {
    time: "iso8601";
    shortwave_radiation_sum: "MJ/m²";
    cloud_cover_mean: "%";
    sunshine_duration: "s";
    daylight_duration: "s";
    temperature_2m_max: "°C";
  };
  daily: {
    time: string[];
    shortwave_radiation_sum: Array<number | null>;
    cloud_cover_mean: Array<number | null>;
    sunshine_duration: Array<number | null>;
    daylight_duration: Array<number | null>;
    temperature_2m_max: Array<number | null>;
  };
}

export interface ResolvedLocation {
  slug: string;
  displayName: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  elevationM: number;
  timezone: string;
}

export interface SolarLocationDataset {
  location: ResolvedLocation;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  days: DailyWeatherRecord[];
  mode: "demo" | "live";
  /** Present when DEMO_MODE matched a custom search query to a demo climate */
  demoFallbackNote?: string;
  attestations: {
    geocode: AttestedCallRecord;
    weather: AttestedCallRecord;
  };
}

// ============================================================================
// Runtime Environment & Edge-Safe Base64 Helpers
// ============================================================================

export interface AirnodeRuntimeEnv {
  DEMO_MODE?: string;
  AIRNODEHUB_WALLET_PRIVATE_KEY?: string;
  AIRNODEHUB_MAX_USD_PER_CALL?: string;
}

function readEnv(
  key: keyof AirnodeRuntimeEnv,
  runtimeEnv?: AirnodeRuntimeEnv
): string | undefined {
  const fromRuntime = runtimeEnv?.[key];
  if (fromRuntime !== undefined && fromRuntime !== "") return fromRuntime;
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

export function isDemoModeEnabled(runtimeEnv?: AirnodeRuntimeEnv): boolean {
  const raw = readEnv("DEMO_MODE", runtimeEnv);
  // Explicit DEMO_MODE=false enables live AirnodeHub x402 calls.
  // If unset, fall back safely to demo unless a burner private key is provided.
  if (raw === "false") return false;
  if (raw === "true") return true;
  return !readEnv("AIRNODEHUB_WALLET_PRIVATE_KEY", runtimeEnv);
}

function encodeUtf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeUtf8Base64(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function randomBytes32Hex(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = "0x";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex as Hex;
}

function normalizePrivateKeyHex(rawKey: string): Hex {
  const trimmed = rawKey.trim();
  const prefixed = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(prefixed)) {
    throw new Error("Server payment wallet configuration is invalid.");
  }
  return prefixed as Hex;
}

function slugifyDisplayName(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "my-roof"
  );
}

/**
 * Compute a complete 365-day historical reanalysis date window ending 5 days
 * before today (accounting for Open-Meteo ERA5 archive lag).
 */
export function getHistoricalYearWindow(now: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 5)
  );
  const start = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - 364)
  );
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

// ============================================================================
// Parsing Helpers (Open-Meteo -> Solar Physics DailyWeatherRecord[])
// ============================================================================

export function parseOpenMeteoDailyToRecords(
  payload: OpenMeteoHistoricalDailyResponse
): DailyWeatherRecord[] {
  const { daily } = payload;
  const count = daily.time.length;
  const records: DailyWeatherRecord[] = [];

  for (let i = 0; i < count; i++) {
    const mj = daily.shortwave_radiation_sum[i];
    const cloud = daily.cloud_cover_mean[i];
    const sunSec = daily.sunshine_duration[i];
    const daySec = daily.daylight_duration[i];
    const maxT = daily.temperature_2m_max[i];

    // Skip trailing nulls if upstream archive has a 1-2 day lag at the end
    if (mj === null || mj === undefined) continue;

    records.push({
      date: daily.time[i],
      shortwaveRadiationMjM2: Number(mj.toFixed(2)),
      ghiKwhM2: Number(normalizeIrradianceToKwhPerM2(mj, "MJ/m²").toFixed(3)),
      cloudCoverPct: Math.round(Math.max(0, Math.min(100, cloud ?? 45))),
      sunshineHours: Number(((sunSec ?? 0) / 3600).toFixed(2)),
      daylightHours: Number(((daySec ?? 43200) / 3600).toFixed(2)),
      maxTempC: Number((maxT ?? 20).toFixed(1)),
    });
  }

  return records;
}

// ============================================================================
// Live API3 AirnodeHub x402 v2 Client (Geoapify Free + Open-Meteo $0.10 aUSD)
// ============================================================================

interface X402PaymentAccept {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  extra?: {
    name?: string;
    version?: string;
  };
}

interface X402PaymentRequiredHeader {
  x402Version: number;
  error?: string;
  resource?: {
    url: string;
    description?: string;
    mimeType?: string;
  };
  accepts: X402PaymentAccept[];
}

interface X402PaymentResponseHeader {
  success?: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
}

const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

async function signX402ExactPaymentHeader(
  paymentRequired: X402PaymentRequiredHeader,
  runtimeEnv?: AirnodeRuntimeEnv
): Promise<{
  paymentHeader: string;
  amountUsd: string;
  payer: string;
  network: string;
}> {
  if (paymentRequired.x402Version !== 2) {
    throw new Error("Unsupported x402 protocol version returned by Airnode.");
  }

  const rawKey = readEnv("AIRNODEHUB_WALLET_PRIVATE_KEY", runtimeEnv);
  if (!rawKey) {
    throw new Error(
      "Live sunlight lookups require AIRNODEHUB_WALLET_PRIVATE_KEY on the server."
    );
  }

  const maxUsdStr = readEnv("AIRNODEHUB_MAX_USD_PER_CALL", runtimeEnv) || "0.15";
  const maxUsd = Number.parseFloat(maxUsdStr);
  const maxMicroUsd = BigInt(
    Math.round((Number.isFinite(maxUsd) && maxUsd > 0 ? maxUsd : 0.15) * 1_000_000)
  );

  // Strictly validate network, aUSD asset contract, and payTo recipient before signing
  const accept = paymentRequired.accepts.find(
    (entry) =>
      entry.scheme === "exact" &&
      entry.network === AIRNODEHUB_CONFIG.payment.network &&
      entry.asset.toLowerCase() ===
        AIRNODEHUB_CONFIG.payment.asset.toLowerCase() &&
      entry.payTo.toLowerCase() === AIRNODEHUB_CONFIG.payment.payTo.toLowerCase()
  );

  if (!accept) {
    throw new Error(
      "Airnode payment requirements did not match the expected Base Sepolia aUSD contract."
    );
  }

  const amountUnits = BigInt(accept.amount);
  if (amountUnits <= BigInt(0) || amountUnits > maxMicroUsd) {
    throw new Error(
      "Airnode call price exceeded the server per-call spending safety limit."
    );
  }

  const account = privateKeyToAccount(normalizePrivateKeyHex(rawKey));
  const nowSec = Math.floor(Date.now() / 1000);
  const timeoutSec = Math.min(accept.maxTimeoutSeconds ?? 300, 600);
  const validAfter = BigInt(nowSec - 60);
  const validBefore = BigInt(nowSec + timeoutSec);
  const nonce = randomBytes32Hex();

  const signature = await account.signTypedData({
    domain: {
      name: accept.extra?.name || "AirnodeHub USD",
      version: accept.extra?.version || "1",
      chainId: AIRNODEHUB_CONFIG.payment.chainId,
      verifyingContract: accept.asset as Address,
    },
    types: EIP3009_TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: account.address,
      to: accept.payTo as Address,
      value: amountUnits,
      validAfter,
      validBefore,
      nonce,
    },
  });

  const paymentPayload = {
    x402Version: 2,
    resource: paymentRequired.resource,
    accepted: accept,
    payload: {
      signature,
      authorization: {
        from: account.address,
        to: accept.payTo,
        value: accept.amount,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      },
    },
  };

  return {
    paymentHeader: encodeUtf8Base64(JSON.stringify(paymentPayload)),
    amountUsd: (Number(amountUnits) / 1_000_000).toFixed(2),
    payer: account.address,
    network: accept.network,
  };
}

/**
 * Perform an attested AirnodeHub `POST /` operation, automatically handling
 * x402 v2 EIP-3009 settlement when the Airnode responds with 402.
 */
async function callAirnodeOperation(params: {
  endpointUrl: string;
  expectedAirnode: string;
  provider: "Geoapify" | "Open-Meteo";
  operation: string;
  parameters: Record<string, string | number | boolean>;
  defaultPriceUsd: string;
  runtimeEnv?: AirnodeRuntimeEnv;
}): Promise<AttestedCallRecord> {
  const body = JSON.stringify({
    operation: params.operation,
    parameters: params.parameters,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28_000);

  try {
    let response = await fetch(`${params.endpointUrl}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      signal: controller.signal,
    });

    let settlement: PaymentReceiptSummary | undefined;

    if (response.status === 402) {
      const reqHeader = response.headers.get("payment-required");
      if (!reqHeader) {
        throw new Error(
          `${params.provider} Airnode requested payment without PAYMENT-REQUIRED header.`
        );
      }

      const paymentRequired = JSON.parse(
        decodeUtf8Base64(reqHeader)
      ) as X402PaymentRequiredHeader;

      const signed = await signX402ExactPaymentHeader(
        paymentRequired,
        params.runtimeEnv
      );

      response = await fetch(`${params.endpointUrl}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "PAYMENT-SIGNATURE": signed.paymentHeader,
        },
        body,
        signal: controller.signal,
      });

      const receiptHeader = response.headers.get("payment-response");
      if (receiptHeader) {
        try {
          const parsedReceipt = JSON.parse(
            decodeUtf8Base64(receiptHeader)
          ) as X402PaymentResponseHeader;
          settlement = {
            network: parsedReceipt.network || signed.network,
            amountUsd: signed.amountUsd,
            transaction: parsedReceipt.transaction,
            payer: parsedReceipt.payer || signed.payer,
            success: parsedReceipt.success ?? response.ok,
          };
        } catch {
          settlement = {
            network: signed.network,
            amountUsd: signed.amountUsd,
            payer: signed.payer,
            success: response.ok,
          };
        }
      } else {
        settlement = {
          network: signed.network,
          amountUsd: signed.amountUsd,
          payer: signed.payer,
          success: response.ok,
        };
      }

      if (response.status === 402) {
        throw new Error(
          "x402 aUSD payment could not settle on Base Sepolia. Please verify the testnet burner wallet has aUSD balance."
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        `${params.provider} Airnode returned HTTP ${response.status}. Please try again shortly.`
      );
    }

    const envelope = (await response.json()) as AirnodeAttestationEnvelope;
    if (
      !envelope ||
      typeof envelope.data !== "string" ||
      typeof envelope.signature !== "string"
    ) {
      throw new Error(`${params.provider} Airnode returned an unexpected envelope.`);
    }

    // Cryptographically verify the response signature & request binding server-side
    const verification = await verifyAirnodeAttestation({
      envelope,
      expectedAirnode: params.expectedAirnode,
      operation: params.operation,
      parameters: params.parameters,
    });

    if (!verification.valid) {
      throw new Error(
        `${params.provider} Airnode cryptographic attestation check failed.`
      );
    }

    return {
      provider: params.provider,
      endpointUrl: params.endpointUrl,
      operation: params.operation,
      parameters: params.parameters,
      priceUsd: settlement?.amountUsd ?? params.defaultPriceUsd,
      mode: "live",
      envelope,
      settlement,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Step 1 (Live, $0.00): Geocode any address or city via Geoapify Airnode.
 */
export async function geocodeLiveLocation(
  query: string,
  runtimeEnv?: AirnodeRuntimeEnv
): Promise<{ location: ResolvedLocation; attestation: AttestedCallRecord }> {
  // Expand known featured city slugs cleanly into full readable city queries
  const matchedDemo = DEMO_CITY_BLUEPRINTS.find(
    (c) => c.slug === normalizeQuery(query)
  );
  const searchText = matchedDemo ? matchedDemo.displayName : query.trim();

  const attestation = await callAirnodeOperation({
    endpointUrl: AIRNODEHUB_CONFIG.geoapify.url,
    expectedAirnode: AIRNODEHUB_CONFIG.geoapify.address,
    provider: "Geoapify",
    operation: AIRNODEHUB_CONFIG.geoapify.operation,
    parameters: {
      text: searchText,
      limit: 1,
      lang: "en",
    },
    defaultPriceUsd: AIRNODEHUB_CONFIG.geoapify.priceUsd,
    runtimeEnv,
  });

  const parsed = JSON.parse(
    attestation.envelope.data
  ) as GeoapifyGeocodeResponse;
  const feature = parsed.features?.[0];
  if (!feature || !feature.properties) {
    throw new Error(
      `We couldn't find "${searchText}" on the map. Try adding a city or country name.`
    );
  }

  const props = feature.properties;
  const city =
    props.city || props.name || props.county || props.state || props.country;
  const region = props.state || props.county || "";
  const displayName =
    props.formatted || [city, props.country].filter(Boolean).join(", ");

  const location: ResolvedLocation = {
    slug: matchedDemo?.slug ?? slugifyDisplayName(displayName),
    displayName,
    city,
    region,
    country: props.country || "",
    countryCode: (props.country_code || "").toLowerCase(),
    lat: Number(props.lat),
    lon: Number(props.lon),
    elevationM: 0,
    timezone: props.timezone?.name || "UTC",
  };

  return { location, attestation };
}

export interface AutocompleteSuggestion {
  id: string;
  formatted: string;
  primary: string;
  secondary: string;
  lat: number;
  lon: number;
  countryCode: string;
}

/**
 * Free ($0.00) worldwide address autocomplete via Geoapify Airnode.
 * Uses bias=countrycode:none so suggestions are global rather than biased to server IP.
 */
export async function autocompleteAddresses(
  text: string,
  runtimeEnv?: AirnodeRuntimeEnv
): Promise<AutocompleteSuggestion[]> {
  const trimmed = text.trim();
  if (trimmed.length < 2) return [];

  if (isDemoModeEnabled(runtimeEnv)) {
    const q = normalizeQuery(trimmed);
    return DEMO_CITY_BLUEPRINTS.filter(
      (c) =>
        normalizeQuery(c.displayName).includes(q) ||
        c.aliases.some((a) => normalizeQuery(a).includes(q))
    ).map((c) => ({
      id: c.slug,
      formatted: c.displayName,
      primary: c.city,
      secondary: [c.region, c.country].filter(Boolean).join(", "),
      lat: c.lat,
      lon: c.lon,
      countryCode: c.countryCode,
    }));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${AIRNODEHUB_CONFIG.geoapify.url}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        operation: "autocomplete",
        parameters: {
          text: trimmed,
          limit: 5,
          lang: "en",
          bias: "countrycode:none",
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) return [];
    const envelope = (await response.json()) as AirnodeAttestationEnvelope;
    if (!envelope || typeof envelope.data !== "string") return [];

    const parsed = JSON.parse(envelope.data) as GeoapifyGeocodeResponse;
    const seen = new Set<string>();
    const results: AutocompleteSuggestion[] = [];

    for (const feature of parsed.features ?? []) {
      const p = feature.properties;
      if (!p || !p.formatted || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) {
        continue;
      }
      const dedupeKey = p.formatted.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const primary =
        p.address_line1 || p.name || p.city || p.formatted.split(",")[0];
      const secondary =
        p.address_line2 ||
        [p.city !== primary ? p.city : "", p.state, p.country]
          .filter(Boolean)
          .join(", ");

      results.push({
        id: `${p.lat.toFixed(4)},${p.lon.toFixed(4)}:${results.length}`,
        formatted: p.formatted,
        primary,
        secondary,
        lat: Number(p.lat),
        lon: Number(p.lon),
        countryCode: (p.country_code || "").toLowerCase(),
      });
    }

    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Step 2 (Live, $0.10 aUSD): Fetch 12 months of daily solar irradiance, cloud
 * cover, sunshine duration, and max temperature via Open-Meteo Airnode.
 */
export async function fetchLiveOpenMeteoDataset(
  location: ResolvedLocation,
  geocodeAttestation: AttestedCallRecord,
  runtimeEnv?: AirnodeRuntimeEnv
): Promise<SolarLocationDataset> {
  const { startDate, endDate } = getHistoricalYearWindow();

  const weatherAttestation = await callAirnodeOperation({
    endpointUrl: AIRNODEHUB_CONFIG.openMeteo.url,
    expectedAirnode: AIRNODEHUB_CONFIG.openMeteo.address,
    provider: "Open-Meteo",
    operation: AIRNODEHUB_CONFIG.openMeteo.operation,
    parameters: {
      latitude: location.lat.toFixed(4),
      longitude: location.lon.toFixed(4),
      start_date: startDate,
      end_date: endDate,
      daily: AIRNODEHUB_CONFIG.openMeteo.dailyVariables,
      temperature_unit: "celsius",
      timezone: "auto",
    },
    defaultPriceUsd: AIRNODEHUB_CONFIG.openMeteo.priceUsd,
    runtimeEnv,
  });

  const weatherPayload = JSON.parse(
    weatherAttestation.envelope.data
  ) as OpenMeteoHistoricalDailyResponse;

  const days = parseOpenMeteoDailyToRecords(weatherPayload);
  if (days.length < 30) {
    throw new Error(
      "Historical solar data was incomplete for those coordinates. Try a nearby town or city."
    );
  }

  const enrichedLocation: ResolvedLocation = {
    ...location,
    elevationM: Math.round(weatherPayload.elevation ?? location.elevationM),
    timezone: weatherPayload.timezone || location.timezone,
  };

  return {
    location: enrichedLocation,
    dateRange: {
      startDate: days[0].date,
      endDate: days[days.length - 1].date,
    },
    days,
    mode: "live",
    attestations: {
      geocode: geocodeAttestation,
      weather: weatherAttestation,
    },
  };
}

// ============================================================================
// DEMO_MODE=true Curated 5-City Global Sunlight Profiles
// ============================================================================

interface DemoCityBlueprint {
  slug: string;
  shortLabel: string;
  displayName: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  elevationM: number;
  timezone: string;
  utcOffsetSeconds: number;
  tzAbbr: string;
  aliases: string[];
  featuredOnHero: boolean;
  monthlyRadiationMj: readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  monthlyCloudPct: readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  monthlyMaxTempC: readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  cloudySpell: { startDayOfYear: number; lengthDays: number };
  seed: number;
}

const DEMO_CITY_BLUEPRINTS: readonly DemoCityBlueprint[] = [
  {
    slug: "lisbon-portugal",
    shortLabel: "Lisbon, Portugal",
    displayName: "Lisbon, Portugal",
    city: "Lisbon",
    region: "Lisbon",
    country: "Portugal",
    countryCode: "pt",
    lat: 38.7078,
    lon: -9.1366,
    elevationM: 38,
    timezone: "Europe/Lisbon",
    utcOffsetSeconds: 0,
    tzAbbr: "WET",
    aliases: ["lisbon", "lisboa", "portugal", "pt", "alfama", "cascais"],
    featuredOnHero: true,
    monthlyRadiationMj: [
      9.4, 12.6, 17.5, 21.8, 25.4, 27.6, 28.4, 25.6, 20.4, 14.5, 10.2, 8.3,
    ],
    monthlyCloudPct: [48, 44, 38, 36, 28, 19, 12, 14, 24, 38, 46, 51],
    monthlyMaxTempC: [
      14.9, 16.0, 18.6, 20.1, 22.8, 26.2, 28.6, 29.0, 26.8, 22.7, 18.3, 15.4,
    ],
    cloudySpell: { startDayOfYear: 342, lengthDays: 4 },
    seed: 101,
  },
  {
    slug: "eskisehir-turkey",
    shortLabel: "Eskişehir, Turkey",
    displayName: "Eskişehir, Turkey",
    city: "Eskişehir",
    region: "Central Anatolia",
    country: "Turkey",
    countryCode: "tr",
    lat: 39.7767,
    lon: 30.5206,
    elevationM: 792,
    timezone: "Europe/Istanbul",
    utcOffsetSeconds: 10800,
    tzAbbr: "TRT",
    aliases: [
      "eskisehir",
      "eskişehir",
      "turkey",
      "türkiye",
      "turkiye",
      "tr",
      "odunpazari",
      "odunpazarı",
      "tepebasi",
      "tepebaşı",
      "anatolia",
    ],
    featuredOnHero: true,
    monthlyRadiationMj: [
      6.9, 10.2, 15.1, 19.6, 23.4, 26.4, 27.2, 24.4, 19.1, 13.0, 8.3, 5.9,
    ],
    monthlyCloudPct: [67, 61, 53, 46, 36, 22, 13, 14, 23, 41, 56, 68],
    monthlyMaxTempC: [
      4.4, 6.8, 12.1, 17.5, 22.6, 26.9, 30.2, 30.4, 26.1, 19.8, 12.6, 6.4,
    ],
    cloudySpell: { startDayOfYear: 12, lengthDays: 5 },
    seed: 207,
  },
  {
    slug: "austin-tx",
    shortLabel: "Austin, TX",
    displayName: "Austin, Texas",
    city: "Austin",
    region: "Texas",
    country: "United States",
    countryCode: "us",
    lat: 30.2672,
    lon: -97.7431,
    elevationM: 149,
    timezone: "America/Chicago",
    utcOffsetSeconds: -21600,
    tzAbbr: "CST",
    aliases: ["austin", "texas", "tx", "usa", "us", "united states"],
    featuredOnHero: true,
    monthlyRadiationMj: [
      11.0, 13.8, 17.6, 20.6, 22.8, 25.0, 25.6, 23.8, 19.8, 16.0, 12.1, 10.2,
    ],
    monthlyCloudPct: [49, 48, 46, 44, 42, 31, 25, 26, 33, 36, 44, 48],
    monthlyMaxTempC: [
      16.8, 19.3, 23.4, 27.1, 30.8, 34.6, 36.8, 37.4, 33.4, 28.1, 22.0, 17.6,
    ],
    cloudySpell: { startDayOfYear: 26, lengthDays: 4 },
    seed: 313,
  },
  {
    slug: "amsterdam-nl",
    shortLabel: "Amsterdam, NL",
    displayName: "Amsterdam, Netherlands",
    city: "Amsterdam",
    region: "North Holland",
    country: "Netherlands",
    countryCode: "nl",
    lat: 52.3676,
    lon: 4.9041,
    elevationM: 2,
    timezone: "Europe/Amsterdam",
    utcOffsetSeconds: 3600,
    tzAbbr: "CET",
    aliases: [
      "amsterdam",
      "netherlands",
      "holland",
      "nl",
      "utrecht",
      "rotterdam",
    ],
    featuredOnHero: true,
    monthlyRadiationMj: [
      2.6, 5.1, 9.6, 14.8, 18.6, 19.9, 19.0, 16.0, 11.2, 6.4, 3.2, 2.0,
    ],
    monthlyCloudPct: [77, 72, 66, 59, 57, 58, 59, 58, 62, 69, 76, 79],
    monthlyMaxTempC: [
      5.8, 6.6, 10.0, 13.9, 17.6, 20.2, 22.3, 22.1, 18.9, 14.5, 9.7, 6.5,
    ],
    cloudySpell: { startDayOfYear: 350, lengthDays: 9 },
    seed: 419,
  },
  {
    slug: "kyoto-japan",
    shortLabel: "Kyoto, Japan",
    displayName: "Kyoto, Japan",
    city: "Kyoto",
    region: "Kansai",
    country: "Japan",
    countryCode: "jp",
    lat: 35.0116,
    lon: 135.7681,
    elevationM: 51,
    timezone: "Asia/Tokyo",
    utcOffsetSeconds: 32400,
    tzAbbr: "JST",
    aliases: ["kyoto", "japan", "jp", "kansai", "osaka", "tokyo"],
    featuredOnHero: false,
    monthlyRadiationMj: [
      8.4, 10.8, 14.2, 17.6, 19.2, 15.8, 18.2, 19.6, 14.8, 12.4, 9.5, 7.8,
    ],
    monthlyCloudPct: [54, 56, 55, 52, 54, 71, 61, 48, 57, 50, 48, 51],
    monthlyMaxTempC: [
      9.1, 10.2, 14.3, 20.4, 25.4, 28.6, 32.5, 34.2, 29.7, 23.6, 17.5, 11.7,
    ],
    cloudySpell: { startDayOfYear: 164, lengthDays: 6 },
    seed: 523,
  },
];

export const HERO_INSPIRATION_CITIES = DEMO_CITY_BLUEPRINTS.filter(
  (c) => c.featuredOnHero
).map((c) => ({
  slug: c.slug,
  label: c.shortLabel,
  displayName: c.displayName,
}));

export const ALL_DEMO_CITIES = DEMO_CITY_BLUEPRINTS.map((c) => ({
  slug: c.slug,
  label: c.shortLabel,
  displayName: c.displayName,
  lat: c.lat,
  lon: c.lon,
}));

function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function interpolateMonthly(
  values: readonly number[],
  monthIndex: number,
  dayInMonth: number,
  daysInMonth: number
): number {
  const frac = dayInMonth / daysInMonth - 0.5;
  const cur = values[monthIndex];
  if (frac >= 0) {
    const next = values[(monthIndex + 1) % 12];
    return cur + (next - cur) * frac * 0.65;
  }
  const prev = values[(monthIndex + 11) % 12];
  return cur + (prev - cur) * Math.abs(frac) * 0.65;
}

function pseudoHex(seedStr: string, length: number): string {
  let h1 = 0xdeadbeef ^ seedStr.length;
  let h2 = 0x41c6ce57 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    const ch = seedStr.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  let out = "";
  let step = 0;
  while (out.length < length) {
    h1 = Math.imul(h1 ^ (h1 >>> 16) ^ step++, 2246822507);
    h2 = Math.imul(h2 ^ (h2 >>> 13) ^ step++, 3266489909);
    out += (h1 >>> 0).toString(16).padStart(8, "0");
    out += (h2 >>> 0).toString(16).padStart(8, "0");
  }
  return `0x${out.slice(0, length)}`;
}

function computeDaylightSeconds(lat: number, dayOfYear: number): number {
  const latRad = (lat * Math.PI) / 180;
  const declRad =
    ((23.44 * Math.PI) / 180) *
    Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const cosH = Math.max(
    -0.98,
    Math.min(0.98, -Math.tan(latRad) * Math.tan(declRad))
  );
  const hours = (2 / 15) * ((Math.acos(cosH) * 180) / Math.PI);
  return Math.round(hours * 3600);
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const demoDatasetCache = new Map<string, SolarLocationDataset>();

function synthesizeDemoDataset(
  blueprint: DemoCityBlueprint
): SolarLocationDataset {
  const cached = demoDatasetCache.get(blueprint.slug);
  if (cached) return cached;

  const rng = createSeededRng(blueprint.seed);
  const year = 2025;
  const time: string[] = [];
  const shortwave_radiation_sum: number[] = [];
  const cloud_cover_mean: number[] = [];
  const sunshine_duration: number[] = [];
  const daylight_duration: number[] = [];
  const temperature_2m_max: number[] = [];

  const annualMeanMj =
    blueprint.monthlyRadiationMj.reduce((a, b) => a + b, 0) / 12;

  let dayOfYear = 0;
  for (let m = 0; m < 12; m++) {
    const dim = DAYS_IN_MONTH[m];
    for (let d = 1; d <= dim; d++) {
      dayOfYear += 1;
      const isoDate = `${year}-${String(m + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;

      const baseMj = interpolateMonthly(
        blueprint.monthlyRadiationMj,
        m,
        d,
        dim
      );
      const baseCloud = interpolateMonthly(
        blueprint.monthlyCloudPct,
        m,
        d,
        dim
      );
      const baseTemp = interpolateMonthly(
        blueprint.monthlyMaxTempC,
        m,
        d,
        dim
      );

      const wave = Math.sin(dayOfYear * 0.42 + blueprint.seed) * 0.14;
      const jitter = (rng() - 0.5) * 0.24;
      const inCloudySpell =
        dayOfYear >= blueprint.cloudySpell.startDayOfYear &&
        dayOfYear <
          blueprint.cloudySpell.startDayOfYear +
            blueprint.cloudySpell.lengthDays;

      let mj = baseMj * (1 + wave + jitter);
      let cloud = baseCloud - (wave + jitter) * 58;
      let temp = baseTemp + (rng() - 0.5) * 4.4 + wave * 2.5;

      if (inCloudySpell) {
        mj = Math.max(0.45, annualMeanMj * (0.14 + rng() * 0.08));
        cloud = Math.min(100, 88 + rng() * 11);
        temp = baseTemp - 2.4 - rng() * 1.8;
      } else {
        mj = Math.max(annualMeanMj * 0.28, Math.min(32.5, mj));
      }

      cloud = Math.max(0, Math.min(100, cloud));
      const daylightSec = computeDaylightSeconds(blueprint.lat, dayOfYear);
      const clearFraction = Math.max(
        0.05,
        Math.min(0.95, 1 - (cloud / 100) * 0.88)
      );
      const sunshineSec = Math.round(daylightSec * clearFraction);

      time.push(isoDate);
      shortwave_radiation_sum.push(Number(mj.toFixed(2)));
      cloud_cover_mean.push(Math.round(cloud));
      sunshine_duration.push(sunshineSec);
      daylight_duration.push(daylightSec);
      temperature_2m_max.push(Number(temp.toFixed(1)));
    }
  }

  const geocodePayload: GeoapifyGeocodeResponse = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: blueprint.city,
          formatted: blueprint.displayName,
          address_line1: blueprint.city,
          address_line2: blueprint.country,
          city: blueprint.city,
          state: blueprint.region,
          country: blueprint.country,
          country_code: blueprint.countryCode,
          lat: blueprint.lat,
          lon: blueprint.lon,
          result_type: "city",
          timezone: {
            name: blueprint.timezone,
            offset_STD: "+00:00",
            offset_DST: "+01:00",
            offset_STD_seconds: blueprint.utcOffsetSeconds,
            offset_DST_seconds: blueprint.utcOffsetSeconds + 3600,
            abbreviation_STD: blueprint.tzAbbr,
            abbreviation_DST: blueprint.tzAbbr,
          },
        },
        geometry: {
          type: "Point",
          coordinates: [blueprint.lon, blueprint.lat],
        },
      },
    ],
    query: { text: blueprint.displayName },
  };

  const weatherPayload: OpenMeteoHistoricalDailyResponse = {
    latitude: blueprint.lat,
    longitude: blueprint.lon,
    elevation: blueprint.elevationM,
    generationtime_ms: 14.2,
    utc_offset_seconds: blueprint.utcOffsetSeconds,
    timezone: blueprint.timezone,
    timezone_abbreviation: blueprint.tzAbbr,
    daily_units: {
      time: "iso8601",
      shortwave_radiation_sum: "MJ/m²",
      cloud_cover_mean: "%",
      sunshine_duration: "s",
      daylight_duration: "s",
      temperature_2m_max: "°C",
    },
    daily: {
      time,
      shortwave_radiation_sum,
      cloud_cover_mean,
      sunshine_duration,
      daylight_duration,
      temperature_2m_max,
    },
  };

  const startDate = time[0];
  const endDate = time[time.length - 1];
  const geocodeDataStr = JSON.stringify(geocodePayload);
  const weatherDataStr = JSON.stringify(weatherPayload);
  const demoTimestamp = "1767225600";

  const dataset: SolarLocationDataset = {
    location: {
      slug: blueprint.slug,
      displayName: blueprint.displayName,
      city: blueprint.city,
      region: blueprint.region,
      country: blueprint.country,
      countryCode: blueprint.countryCode,
      lat: blueprint.lat,
      lon: blueprint.lon,
      elevationM: blueprint.elevationM,
      timezone: blueprint.timezone,
    },
    dateRange: { startDate, endDate },
    days: parseOpenMeteoDailyToRecords(weatherPayload),
    mode: "demo",
    attestations: {
      geocode: {
        provider: "Geoapify",
        endpointUrl: AIRNODEHUB_CONFIG.geoapify.url,
        operation: AIRNODEHUB_CONFIG.geoapify.operation,
        parameters: {
          text: blueprint.displayName,
          limit: 1,
          lang: "en",
        },
        priceUsd: AIRNODEHUB_CONFIG.geoapify.priceUsd,
        mode: "demo",
        envelope: {
          airnode: AIRNODEHUB_CONFIG.geoapify.address,
          requestHash: pseudoHex(`geocode:${blueprint.slug}`, 64),
          timestamp: demoTimestamp,
          data: geocodeDataStr,
          signature: pseudoHex(`sig:geocode:${blueprint.slug}`, 130),
        },
      },
      weather: {
        provider: "Open-Meteo",
        endpointUrl: AIRNODEHUB_CONFIG.openMeteo.url,
        operation: AIRNODEHUB_CONFIG.openMeteo.operation,
        parameters: {
          latitude: String(blueprint.lat),
          longitude: String(blueprint.lon),
          start_date: startDate,
          end_date: endDate,
          daily: AIRNODEHUB_CONFIG.openMeteo.dailyVariables,
          temperature_unit: "celsius",
          timezone: "auto",
        },
        priceUsd: AIRNODEHUB_CONFIG.openMeteo.priceUsd,
        mode: "demo",
        envelope: {
          airnode: AIRNODEHUB_CONFIG.openMeteo.address,
          requestHash: pseudoHex(`weather:${blueprint.slug}`, 64),
          timestamp: demoTimestamp,
          data: weatherDataStr,
          signature: pseudoHex(`sig:weather:${blueprint.slug}`, 130),
        },
      },
    },
  };

  demoDatasetCache.set(blueprint.slug, dataset);
  return dataset;
}

export function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

export function resolveDemoLocation(queryOrSlug: string): SolarLocationDataset {
  const normalized = normalizeQuery(queryOrSlug);

  const exactSlug = DEMO_CITY_BLUEPRINTS.find((c) => c.slug === normalized);
  if (exactSlug) return synthesizeDemoDataset(exactSlug);

  const aliasMatch = DEMO_CITY_BLUEPRINTS.find(
    (c) =>
      normalizeQuery(c.displayName).includes(normalized) ||
      normalized.includes(normalizeQuery(c.city)) ||
      c.aliases.some((alias) => normalized.includes(normalizeQuery(alias)))
  );
  if (aliasMatch) return synthesizeDemoDataset(aliasMatch);

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  const fallback = DEMO_CITY_BLUEPRINTS[hash % DEMO_CITY_BLUEPRINTS.length];
  const base = synthesizeDemoDataset(fallback);

  return {
    ...base,
    demoFallbackNote: `Preview Mode is active: showing curated sunlight data for ${fallback.displayName} while exploring "${queryOrSlug.trim()}".`,
  };
}

export async function fetchSolarLocationData(
  query: string,
  runtimeEnv?: AirnodeRuntimeEnv
): Promise<SolarLocationDataset> {
  if (isDemoModeEnabled(runtimeEnv)) {
    return resolveDemoLocation(query);
  }

  const { location, attestation } = await geocodeLiveLocation(
    query,
    runtimeEnv
  );
  return fetchLiveOpenMeteoDataset(location, attestation, runtimeEnv);
}
