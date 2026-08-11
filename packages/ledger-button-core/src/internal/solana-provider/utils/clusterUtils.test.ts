import {
  getClusterFromCurrencyId,
  getCurrencyIdFromCluster,
  isSupportedSolanaCurrency,
  resolveSolanaCurrencyId,
  resolveSolanaNetwork,
} from "./clusterUtils.js";

describe("clusterUtils", () => {
  describe("getClusterFromCurrencyId", () => {
    it("should return mainnet for solana currency", () => {
      expect(getClusterFromCurrencyId("solana")).toBe("mainnet");
    });

    it.each([
      { currencyId: "unknown-currency", description: "unknown currency" },
      { currencyId: "", description: "empty string" },
      { currencyId: "ethereum", description: "non-Solana currency" },
    ])("should return default cluster for $description", ({ currencyId }) => {
      expect(getClusterFromCurrencyId(currencyId)).toBe("mainnet");
    });
  });

  describe("getCurrencyIdFromCluster", () => {
    it("should return solana for mainnet cluster", () => {
      expect(getCurrencyIdFromCluster("mainnet")).toBe("solana");
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

  describe("resolveSolanaNetwork", () => {
    it("returns network ref for solana", () => {
      expect(resolveSolanaNetwork("solana")).toEqual({
        networkId: "mainnet",
        blockchainName: "solana",
      });
    });

    it("returns undefined for unsupported currencies", () => {
      expect(resolveSolanaNetwork("ethereum")).toBeUndefined();
    });
  });

  describe("resolveSolanaCurrencyId", () => {
    it("returns currency id for mainnet", () => {
      expect(resolveSolanaCurrencyId("mainnet")).toBe("solana");
    });

    it("returns undefined for unmapped clusters", () => {
      expect(resolveSolanaCurrencyId("devnet")).toBeUndefined();
    });
  });
});
