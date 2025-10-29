import { getChainIdFromCurrencyId } from "./chainUtils.js";

describe("chainUtils", () => {
  describe("getChainIdFromCurrencyId", () => {
    it("should return chain ID 1 for ethereum", () => {
      const result = getChainIdFromCurrencyId("ethereum");
      expect(result).toBe(1);
    });

    it("should return chain ID 42161 for arbitrum", () => {
      const result = getChainIdFromCurrencyId("arbitrum");
      expect(result).toBe(42161);
    });

    it("should return chain ID 43114 for avalanche", () => {
      const result = getChainIdFromCurrencyId("avalanche_c_chain");
      expect(result).toBe(43114);
    });

    it("should return chain ID 8453 for base", () => {
      const result = getChainIdFromCurrencyId("base");
      expect(result).toBe(8453);
    });

    it("should return chain ID 56 for bsc", () => {
      const result = getChainIdFromCurrencyId("bsc");
      expect(result).toBe(56);
    });

    it("should return chain ID 59144 for linea", () => {
      const result = getChainIdFromCurrencyId("linea");
      expect(result).toBe(59144);
    });

    it("should return chain ID 10 for optimism", () => {
      const result = getChainIdFromCurrencyId("optimism");
      expect(result).toBe(10);
    });

    it("should return chain ID 137 for polygon", () => {
      const result = getChainIdFromCurrencyId("polygon");
      expect(result).toBe(137);
    });

    it("should return chain ID 146 for sonic", () => {
      const result = getChainIdFromCurrencyId("sonic");
      expect(result).toBe(146);
    });

    it("should return chain ID 324 for zksync", () => {
      const result = getChainIdFromCurrencyId("zksync");
      expect(result).toBe(324);
    });

    it("should return default chain ID 1 for unknown currency", () => {
      const result = getChainIdFromCurrencyId("unknown-currency");
      expect(result).toBe(1);
    });

    it("should return default chain ID 1 for empty string", () => {
      const result = getChainIdFromCurrencyId("");
      expect(result).toBe(1);
    });

    it("should return default chain ID 1 for non-existent currency", () => {
      const result = getChainIdFromCurrencyId("solana");
      expect(result).toBe(1);
    });

    it("should be case-sensitive and return default for incorrect casing", () => {
      const result = getChainIdFromCurrencyId("Ethereum");
      expect(result).toBe(1);
    });

    it("should handle special characters by returning default chain ID", () => {
      const result = getChainIdFromCurrencyId("eth@reum");
      expect(result).toBe(1);
    });
  });
});
