/**
 * Cryptographic verification for API3 AirnodeHub EIP-191 attestations.
 *
 * Works identically in browser (VerificationModal) and Cloudflare Workers edge.
 * Implements the exact Airnode v0.2.0 attestation specification:
 *  - requestHash = keccak256(utf8(JSON.stringify([operation, canonical(parameters)])))
 *  - digest      = keccak256(abi.encodePacked(bytes32 requestHash, uint256 timestamp, bytes utf8(data)))
 *  - signature   = EIP-191 secp256k1 personal_sign over raw 32-byte digest
 */

import {
  encodePacked,
  keccak256,
  stringToBytes,
  toHex,
  verifyMessage,
  type Address,
  type Hex,
} from "viem";
import type { AirnodeAttestationEnvelope } from "./airnodehub.ts";

/**
 * Recursively canonicalize an object into sorted [key, value] entry tuples
 * compared by Unicode code point order (matching Airnode's exact spec).
 */
export function canonicalizeValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return keys.map((k) => [k, canonicalizeValue(record[k])]);
}

/**
 * Derive Airnode's canonical `requestHash` for an envelope `POST /` call.
 */
export function computeEnvelopeRequestHash(
  operation: string,
  parameters: Record<string, unknown>,
  responseProjection?: Record<string, string>
): Hex {
  const payload = responseProjection
    ? [
        operation,
        canonicalizeValue(parameters),
        canonicalizeValue(responseProjection),
      ]
    : [operation, canonicalizeValue(parameters)];

  return keccak256(stringToBytes(JSON.stringify(payload)));
}

/**
 * Derive the 32-byte digest signed by the Airnode.
 */
export function computeAttestationDigest(
  requestHash: Hex,
  timestamp: string,
  data: string
): Hex {
  return keccak256(
    encodePacked(
      ["bytes32", "uint256", "bytes"],
      [requestHash, BigInt(timestamp), toHex(data)]
    )
  );
}

export interface AttestationVerificationResult {
  valid: boolean;
  signatureValid: boolean;
  requestHashMatches: boolean;
  addressMatches: boolean;
  computedRequestHash: Hex;
  digest: Hex;
  reason?: string;
}

/**
 * Verify an AirnodeHub attestation end-to-end against its published signer address
 * and the exact operation + parameters that produced it.
 */
export async function verifyAirnodeAttestation(params: {
  envelope: AirnodeAttestationEnvelope;
  expectedAirnode: string;
  operation: string;
  parameters: Record<string, unknown>;
}): Promise<AttestationVerificationResult> {
  const { envelope, expectedAirnode, operation, parameters } = params;

  const computedRequestHash = computeEnvelopeRequestHash(operation, parameters);
  const requestHashMatches =
    computedRequestHash.toLowerCase() === envelope.requestHash.toLowerCase();
  const addressMatches =
    envelope.airnode.toLowerCase() === expectedAirnode.toLowerCase();

  let digest: Hex =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  let signatureValid = false;

  try {
    digest = computeAttestationDigest(
      envelope.requestHash as Hex,
      envelope.timestamp,
      envelope.data
    );

    signatureValid = await verifyMessage({
      address: expectedAirnode as Address,
      message: { raw: digest },
      signature: envelope.signature as Hex,
    });
  } catch (err) {
    return {
      valid: false,
      signatureValid: false,
      requestHashMatches,
      addressMatches,
      computedRequestHash,
      digest,
      reason:
        err instanceof Error ? err.message : "Malformed signature payload",
    };
  }

  return {
    valid: signatureValid && requestHashMatches && addressMatches,
    signatureValid,
    requestHashMatches,
    addressMatches,
    computedRequestHash,
    digest,
  };
}
