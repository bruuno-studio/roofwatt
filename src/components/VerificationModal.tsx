"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AIRNODEHUB_CONFIG,
  type AttestedCallRecord,
  type SolarLocationDataset,
} from "@/lib/airnodehub";
import {
  verifyAirnodeAttestation,
  type AttestationVerificationResult,
} from "@/lib/verify";

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  dataset: SolarLocationDataset;
}

const SPRING = {
  type: "spring" as const,
  stiffness: 200,
  damping: 26,
};

function formatUtcTimestamp(unixSeconds: string): string {
  const num = Number.parseInt(unixSeconds, 10);
  if (!Number.isFinite(num)) return unixSeconds;
  return new Date(num * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function truncateMiddle(hex: string, start = 10, end = 8): string {
  if (hex.length <= start + end + 3) return hex;
  return `${hex.slice(0, start)}…${hex.slice(-end)}`;
}

function formatPayloadPreview(rawData: string): string {
  try {
    const parsed = JSON.parse(rawData);
    const pretty = JSON.stringify(parsed, null, 2);
    return pretty.length > 2600
      ? `${pretty.slice(0, 2600)}\n... (${rawData.length.toLocaleString("en-US")} bytes signed verbatim)`
      : pretty;
  } catch {
    return rawData.slice(0, 2000);
  }
}

interface ProofCardProps {
  record: AttestedCallRecord;
  expectedAddress: string;
  verification: AttestationVerificationResult | null;
}

function AttestationProofCard({
  record,
  expectedAddress,
  verification,
}: ProofCardProps) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="rounded-2xl border border-[#528A5F]/16 bg-[#FAFBF7]/90 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1D2F23]">
            {record.provider}
          </span>
          <code className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-[#2B6E45] ring-1 ring-[#528A5F]/15">
            {record.operation}
          </code>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-white px-2.5 py-0.5 font-medium text-[#526859] ring-1 ring-[#528A5F]/14 tabular-nums">
            {record.priceUsd === "0.00" ? "Free ($0.00)" : `$${record.priceUsd} aUSD`}
          </span>

          {verification && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${
                verification.valid
                  ? "bg-[#E6F4E8] text-[#235E3A]"
                  : record.mode === "demo"
                    ? "bg-[#FFF8E6] text-[#A46711]"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {verification.valid
                ? "EIP-191 Verified"
                : record.mode === "demo"
                  ? "Demo Schema"
                  : "Check Failed"}
            </span>
          )}
        </div>
      </div>

      {/* Key cryptographic fields */}
      <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
        <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-[#528A5F]/10">
          <dt className="text-[#526859]">Airnode Signer</dt>
          <dd className="mt-0.5 font-mono text-[#1D2F23]">
            {truncateMiddle(record.envelope.airnode, 12, 8)}
          </dd>
        </div>

        <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-[#528A5F]/10">
          <dt className="text-[#526859]">Signed Timestamp</dt>
          <dd className="mt-0.5 font-mono text-[#1D2F23] tabular-nums">
            {formatUtcTimestamp(record.envelope.timestamp)}
          </dd>
        </div>

        <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-[#528A5F]/10">
          <dt className="text-[#526859]">Request Hash</dt>
          <dd className="mt-0.5 font-mono text-[#1D2F23]">
            {truncateMiddle(record.envelope.requestHash, 14, 10)}
          </dd>
        </div>

        <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-[#528A5F]/10">
          <dt className="text-[#526859]">EIP-191 Signature</dt>
          <dd className="mt-0.5 font-mono text-[#1D2F23]">
            {truncateMiddle(record.envelope.signature, 14, 10)}
          </dd>
        </div>
      </dl>

      {/* Settlement Receipt (for live x402 paid calls) */}
      {record.settlement && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#3D8B5B]/18 bg-[#EEF6EA]/75 px-3 py-2 text-[11px] text-[#235E3A]">
          <span>
            x402 Settled · {record.settlement.network} (${record.settlement.amountUsd} aUSD)
          </span>
          {record.settlement.transaction &&
            /^0x[0-9a-fA-F]{64}$/.test(record.settlement.transaction) && (
              <a
                href={`https://sepolia.basescan.org/tx/${record.settlement.transaction}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline decoration-[#3D8B5B]/50 hover:text-[#1D2F23]"
              >
                Tx {truncateMiddle(record.settlement.transaction, 10, 6)} ↗
              </a>
            )}
        </div>
      )}

      {/* Detailed check breakdown after clicking Verify */}
      {verification && (
        <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[#526859] ring-1 ring-[#528A5F]/12">
            Signer match: {verification.addressMatches ? "✓" : "✗"} (
            {truncateMiddle(expectedAddress, 8, 4)})
          </span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[#526859] ring-1 ring-[#528A5F]/12">
            Request hash: {verification.requestHashMatches ? "✓" : "✗"}
          </span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[#526859] ring-1 ring-[#528A5F]/12">
            secp256k1 sig: {verification.signatureValid ? "✓" : "✗"}
          </span>
        </div>
      )}

      {/* Expandable raw signed upstream payload */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="cursor-pointer text-[11px] font-semibold text-[#3D8B5B] hover:text-[#1D2F23]"
        >
          {showRaw ? "Hide raw signed payload" : "Inspect raw signed payload"}
        </button>

        {showRaw && (
          <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-[#528A5F]/14 bg-white p-3 font-mono text-[10.5px] leading-relaxed text-[#1D2F23]">
            {formatPayloadPreview(record.envelope.data)}
          </pre>
        )}
      </div>
    </div>
  );
}

/**
 * Quiet, frosted AirnodeHub cryptographic proof modal.
 * Performs independent browser-side EIP-191 secp256k1 signature & requestHash
 * verification via viem.
 */
export function VerificationModal({
  open,
  onClose,
  dataset,
}: VerificationModalProps) {
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState<{
    geocode: AttestationVerificationResult;
    weather: AttestationVerificationResult;
  } | null>(null);
  const [copiedMcp, setCopiedMcp] = useState(false);

  // Reset verification state when dataset changes
  useEffect(() => {
    setResults(null);
  }, [dataset.location.slug, dataset.attestations.weather.envelope.signature]);

  // Close cleanly on Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function handleVerifyIntegrity() {
    setVerifying(true);
    try {
      const [geocodeRes, weatherRes] = await Promise.all([
        verifyAirnodeAttestation({
          envelope: dataset.attestations.geocode.envelope,
          expectedAirnode: AIRNODEHUB_CONFIG.geoapify.address,
          operation: dataset.attestations.geocode.operation,
          parameters: dataset.attestations.geocode.parameters,
        }),
        verifyAirnodeAttestation({
          envelope: dataset.attestations.weather.envelope,
          expectedAirnode: AIRNODEHUB_CONFIG.openMeteo.address,
          operation: dataset.attestations.weather.operation,
          parameters: dataset.attestations.weather.parameters,
        }),
      ]);
      setResults({ geocode: geocodeRes, weather: weatherRes });
    } finally {
      setVerifying(false);
    }
  }

  async function handleCopyMcp() {
    try {
      await navigator.clipboard.writeText(AIRNODEHUB_CONFIG.mcpUrl);
      setCopiedMcp(true);
      setTimeout(() => setCopiedMcp(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="verification-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1D2F23]/28 backdrop-blur-sm"
          />

          {/* Frosted Modal Card */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={SPRING}
            className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#528A5F]/20 bg-white/94 p-6 shadow-[0_24px_64px_rgba(29,47,35,0.18)] backdrop-blur-xl sm:p-7"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#528A5F]/12 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF6EA] px-3 py-1 text-[11px] font-semibold text-[#2B6E45]">
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M8 1.8L13 3.8V7.6C13 10.9 10.9 13.4 8 14.4C5.1 13.4 3 10.9 3 7.6V3.8L8 1.8Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5.8 8.1L7.3 9.6L10.4 6.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {dataset.mode === "live"
                    ? "Live Attested AirnodeHub Data"
                    : "Preview Mode (Demo Schema)"}
                </div>
                <h2
                  id="verification-modal-title"
                  className="mt-2 font-serif text-2xl text-[#1D2F23]"
                >
                  Verified Sunlight Provenance
                </h2>
                <p className="mt-1 text-xs text-[#526859]">
                  {dataset.location.displayName} · {dataset.dateRange.startDate}{" "}
                  to {dataset.dateRange.endDate} ({dataset.days.length} days)
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close verification dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#528A5F]/16 bg-[#FAFBF7] text-[#526859] transition-colors hover:bg-white hover:text-[#1D2F23]"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M4 4L12 12M12 4L4 12"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Verify Action Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#526859]">
                Checks EIP-191 secp256k1 signatures &amp; request hashes directly
                in your browser.
              </p>

              <button
                type="button"
                disabled={verifying}
                onClick={handleVerifyIntegrity}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#3D8B5B] to-[#56A573] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(61,139,91,0.28)] transition-all hover:shadow-[0_8px_22px_rgba(61,139,91,0.38)] disabled:opacity-60"
              >
                {verifying
                  ? "Verifying..."
                  : results
                    ? "Re-Verify Data Integrity"
                    : "Verify Data Integrity"}
              </button>
            </div>

            {/* Attestation Proof Cards */}
            <div className="mt-4 space-y-3.5">
              <AttestationProofCard
                record={dataset.attestations.geocode}
                expectedAddress={AIRNODEHUB_CONFIG.geoapify.address}
                verification={results?.geocode ?? null}
              />
              <AttestationProofCard
                record={dataset.attestations.weather}
                expectedAddress={AIRNODEHUB_CONFIG.openMeteo.address}
                verification={results?.weather ?? null}
              />
            </div>

            {/* Quiet Developer MCP Copy Row */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#528A5F]/14 bg-[#FAFBF7] px-4 py-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#526859]">
                  AirnodeHub MCP:
                </span>
                <code className="font-mono text-[11px] text-[#1D2F23]">
                  {AIRNODEHUB_CONFIG.mcpUrl}
                </code>
              </div>
              <button
                type="button"
                onClick={handleCopyMcp}
                className="cursor-pointer rounded-full border border-[#528A5F]/20 bg-white px-3 py-1 text-[11px] font-semibold text-[#2B6E45] transition-colors hover:bg-[#EEF6EA]"
              >
                {copiedMcp ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
