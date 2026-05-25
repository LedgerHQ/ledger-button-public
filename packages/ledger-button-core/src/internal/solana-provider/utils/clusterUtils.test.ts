import {
  getClusterFromCurrencyId,
  getCurrencyIdFromCluster,
  isSupportedSolanaCurrency,
} from "./clusterUtils.js";

describe("clusterUtils", () => {
  describe("getClusterFromCurrencyId", () => {
    it("should return mainnet-beta for solana currency", () => {
      expect(getClusterFromCurrencyId("solana")).toBe("mainnet-beta");
    });

    it.each([
      { currencyId: "unknown-currency", description: "unknown currency" },
      { currencyId: "", description: "empty string" },
      { currencyId: "ethereum", description: "non-Solana currency" },
    ])("should return default cluster for $description", ({ currencyId }) => {
      expect(getClusterFromCurrencyId(currencyId)).toBe("mainnet-beta");
    });
  });

  describe("getCurrencyIdFromCluster", () => {
    it("should return solana for mainnet-beta cluster", () => {
      expect(getCurrencyIdFromCluster("mainnet-beta")).toBe("solana");
    });

    it("should return undefined for unmapped cluster", () => {
      expect(getCurrencyIdFromCluster("devnet")).toBeUndefined();
    });
  });

  describe("isSupportedSolanaCurrency", () => {
    it("should return true for solana currency", () => {
      expect(isSupportedSolanaCurrency("solana")).toBe(true);
    });

    it.each([
      { currencyId: "ethereum", description: "non-Solana currency" },
      { currencyId: "", description: "empty string" },
    ])("should return false for $description", ({ currencyId }) => {
      expect(isSupportedSolanaCurrency(currencyId)).toBe(false);
    });
  });
});
