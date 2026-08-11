import {
  getChainIdFromCurrencyId,
  isSupportedEvmCurrency,
  resolveEvmCurrencyId,
  resolveEvmNetwork,
} from "./chainUtils.js";

describe("chainUtils", () => {
  describe("getChainIdFromCurrencyId", () => {
    it.each([
      { currencyId: "ethereum", chainId: 1 },
      { currencyId: "arbitrum", chainId: 42161 },
      { currencyId: "avalanche_c_chain", chainId: 43114 },
      { currencyId: "base", chainId: 8453 },
      { currencyId: "bsc", chainId: 56 },
      { currencyId: "linea", chainId: 59144 },
      { currencyId: "optimism", chainId: 10 },
      { currencyId: "polygon", chainId: 137 },
      { currencyId: "sonic", chainId: 146 },
      { currencyId: "zksync", chainId: 324 },
      { currencyId: "robinhood", chainId: 4663 },
    ])(
      "should return chain ID $chainId for $currencyId",
      ({ currencyId, chainId }) => {
        const result = getChainIdFromCurrencyId(currencyId);
        expect(result).toBe(chainId);
      },
    );

    it.each([
      { currencyId: "unknown-currency", description: "unknown currency" },
      { currencyId: "", description: "empty string" },
      { currencyId: "solana", description: "non-existent currency" },
      { currencyId: "Ethereum", description: "incorrect casing" },
      { currencyId: "eth@reum", description: "special characters" },
    ])(
      "should return default chain ID 1 for $description",
      ({ currencyId }) => {
        const result = getChainIdFromCurrencyId(currencyId);
        expect(result).toBe(1);
      },
    );
  });

  describe("isSupportedEvmCurrency", () => {
    it.each([
      "ethereum",
      "arbitrum",
      "avalanche_c_chain",
      "base",
      "bsc",
      "linea",
      "optimism",
      "polygon",
      "sonic",
      "zksync",
      "robinhood",
    ])("should return true for known EVM currency '%s'", (currencyId) => {
      expect(isSupportedEvmCurrency(currencyId)).toBe(true);
    });

    it.each([
      { currencyId: "solana", description: "non-EVM currency" },
      { currencyId: "bitcoin", description: "non-EVM currency" },
      { currencyId: "", description: "empty string" },
      { currencyId: "Ethereum", description: "incorrect casing" },
      { currencyId: "eth@reum", description: "special characters" },
    ])("should return false for $description", ({ currencyId }) => {
      expect(isSupportedEvmCurrency(currencyId)).toBe(false);
    });
  });

  describe("resolveEvmNetwork", () => {
    it("returns network ref for supported currencies", () => {
      expect(resolveEvmNetwork("polygon")).toEqual({
        networkId: "137",
        blockchainName: "ethereum",
      });
    });

    it("returns undefined for unsupported currencies", () => {
      expect(resolveEvmNetwork("solana")).toBeUndefined();
    });
  });

  describe("resolveEvmCurrencyId", () => {
    it("returns currency id for known chain ids", () => {
      expect(resolveEvmCurrencyId("1")).toBe("ethereum");
    });

    it("returns undefined for unknown chain ids", () => {
      expect(resolveEvmCurrencyId("99999")).toBeUndefined();
    });
  });
});
