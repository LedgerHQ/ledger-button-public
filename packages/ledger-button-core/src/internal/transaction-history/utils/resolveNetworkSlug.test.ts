import { describe, expect, it } from "vitest";

import { resolveNetworkSlug } from "./resolveNetworkSlug";

describe("resolveNetworkSlug", () => {
  it("resolves a currency handled by an EVM provider to its slug", () => {
    expect(resolveNetworkSlug("ethereum", "ethereum")).toBe("ethereum");
    expect(resolveNetworkSlug("polygon", "ethereum")).toBe("polygon");
  });

  it("resolves a currency handled by a Solana provider to its slug", () => {
    expect(resolveNetworkSlug("solana", "solana")).toBe("solana");
  });

  it("resolves a currency handled by an XRP provider to the CoinService slug", () => {
    expect(resolveNetworkSlug("ripple", "xrp")).toBe("xrp");
  });

  it("returns undefined when no provider handles the currency", () => {
    expect(resolveNetworkSlug("not-a-real-chain", undefined)).toBeUndefined();
  });
});
