import { SolanaAppCommandError } from "@ledgerhq/device-signer-kit-solana/internal/app-binder/command/utils/SolanaApplicationErrors.js";
import { getBase58Decoder } from "@solana/kit";
import { describe, expect, it } from "vitest";

import { UserRejectedTransactionError } from "@api/errors/DeviceErrors.js";

import {
  extractRawSignatureBase58,
  extractSignedMessage,
  normalizeSigningError,
} from "./solanaSignFlowUtils.js";

const base58 = (bytes: Uint8Array): string => getBase58Decoder().decode(bytes);

const signatureBytes = new Uint8Array(64).fill(9);

describe("extractRawSignatureBase58", () => {
  it("returns a bare 64-byte signature unchanged", () => {
    const input = base58(signatureBytes);
    expect(extractRawSignatureBase58(input)).toBe(input);
  });

  it("extracts the signature from an OCM envelope [version][sig][message]", () => {
    const message = new TextEncoder().encode("hello");
    const envelope = new Uint8Array(1 + 64 + message.length);
    envelope[0] = 1;
    envelope.set(signatureBytes, 1);
    envelope.set(message, 1 + 64);

    expect(extractRawSignatureBase58(base58(envelope))).toBe(
      base58(signatureBytes),
    );
  });

  it("throws on an unexpected payload length", () => {
    expect(() => extractRawSignatureBase58(base58(new Uint8Array(10)))).toThrow(
      /Unexpected off-chain message signature payload/,
    );
  });
});

describe("extractSignedMessage", () => {
  it("extracts the signed OCM (trailing bytes) from an envelope [version][sig][ocm]", () => {
    const ocm = new TextEncoder().encode("solana offchain ocm");
    const envelope = new Uint8Array(1 + 64 + ocm.length);
    envelope[0] = 1;
    envelope.set(signatureBytes, 1);
    envelope.set(ocm, 1 + 64);

    expect(extractSignedMessage(base58(envelope))).toEqual(ocm);
  });

  it("throws on a bare 64-byte signature (no OCM present)", () => {
    expect(() => extractSignedMessage(base58(signatureBytes))).toThrow(
      /Unexpected off-chain message envelope payload/,
    );
  });

  it("throws on an unexpected payload length", () => {
    expect(() => extractSignedMessage(base58(new Uint8Array(10)))).toThrow(
      /Unexpected off-chain message envelope payload/,
    );
  });
});

describe("normalizeSigningError", () => {
  it("maps the 6985 APDU error to a user-rejected error", () => {
    const apduError = new SolanaAppCommandError({
      message: "Canceled by user",
      errorCode: "6985",
    });

    expect(normalizeSigningError(apduError)).toBeInstanceOf(
      UserRejectedTransactionError,
    );
  });

  it("passes through other errors untouched", () => {
    const error = new Error("network down");
    expect(normalizeSigningError(error)).toBe(error);
  });
});
