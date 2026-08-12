import {
  describeSolanaCurrency,
  describeSolanaNetwork,
  getClusterFromCurrencyId,
  getCurrencyIdFromCluster,
  isSupportedSolanaCurrency,
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

  describe("describeSolanaCurrency", () => {
    it("returns the descriptor for solana", () => {
      expect(describeSolanaCurrency("solana")).toEqual({
        currencyId: "solana",
        family: "solana",
        network: { networkId: "mainnet", blockchainName: "solana" },
        nativeDecimals: 9,
      });
    });

    it("returns undefined for unsupported currencies", () => {
      expect(describeSolanaCurrency("ethereum")).toBeUndefined();
    });
  });

  describe("describeSolanaNetwork", () => {
    it("returns the descriptor for mainnet", () => {
      expect(describeSolanaNetwork("mainnet")).toEqual({
        currencyId: "solana",
        family: "solana",
        network: { networkId: "mainnet", blockchainName: "solana" },
        nativeDecimals: 9,
      });
    });

    it("returns undefined for unmapped clusters", () => {
      expect(describeSolanaNetwork("devnet")).toBeUndefined();
    });
  });
});
