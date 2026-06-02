import { describe, expect, it } from "vitest";

import { resolveNetworkSlug } from "./resolveNetworkSlug.js";

describe("resolveNetworkSlug", () => {
  it("should resolve a supported EVM currencyId to its slug", () => {
    expect(resolveNetworkSlug("ethereum")).toBe("ethereum");
    expect(resolveNetworkSlug("polygon")).toBe("polygon");
  });

  it("should resolve a supported Solana currencyId to its slug", () => {
    expect(resolveNetworkSlug("solana")).toBe("solana");
  });

  it("should return undefined for an unsupported currencyId", () => {
    expect(resolveNetworkSlug("not-a-real-chain")).toBeUndefined();
  });
});
