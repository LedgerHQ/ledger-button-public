import { describe, expect, it } from "vitest";

import { EvmNetworkRegistry } from "./EvmNetworkRegistry";

const NETWORKS = [
  { id: "1", currencyId: "ethereum", currencyName: "Ethereum", currencyTicker: "ETH" },
  { id: "137", currencyId: "polygon", currencyName: "Polygon", currencyTicker: "POL" },
  { id: "81457", currencyId: "blast", currencyName: "Blast", currencyTicker: "ETH" },
];

describe("EvmNetworkRegistry", () => {
  const registry = new EvmNetworkRegistry(NETWORKS);

  describe("getChainIdFromCurrencyId", () => {
    it("returns the chain ID for a known currencyId", () => {
      expect(registry.getChainIdFromCurrencyId("ethereum")).toBe(1);
      expect(registry.getChainIdFromCurrencyId("polygon")).toBe(137);
      expect(registry.getChainIdFromCurrencyId("blast")).toBe(81457);
    });

    it("returns undefined for an unknown currencyId", () => {
      expect(registry.getChainIdFromCurrencyId("solana")).toBeUndefined();
      expect(registry.getChainIdFromCurrencyId("arbitrum")).toBeUndefined();
    });
  });

  describe("getCurrencyIdFromChainId", () => {
    it("returns the currencyId for a known chain ID", () => {
      expect(registry.getCurrencyIdFromChainId(1)).toBe("ethereum");
      expect(registry.getCurrencyIdFromChainId(137)).toBe("polygon");
      expect(registry.getCurrencyIdFromChainId(81457)).toBe("blast");
    });

    it("returns undefined for an unknown chain ID", () => {
      expect(registry.getCurrencyIdFromChainId(42161)).toBeUndefined();
      expect(registry.getCurrencyIdFromChainId(99999)).toBeUndefined();
    });
  });

  describe("isSupportedCurrencyId", () => {
    it("returns true for a known currencyId", () => {
      expect(registry.isSupportedCurrencyId("ethereum")).toBe(true);
      expect(registry.isSupportedCurrencyId("blast")).toBe(true);
    });

    it("returns false for an unknown currencyId", () => {
      expect(registry.isSupportedCurrencyId("solana")).toBe(false);
      expect(registry.isSupportedCurrencyId("")).toBe(false);
    });
  });

  describe("isSupportedChainId", () => {
    it("returns true for a known chain ID", () => {
      expect(registry.isSupportedChainId(1)).toBe(true);
      expect(registry.isSupportedChainId(81457)).toBe(true);
    });

    it("returns false for an unknown chain ID", () => {
      expect(registry.isSupportedChainId(42161)).toBe(false);
      expect(registry.isSupportedChainId(0)).toBe(false);
    });
  });

  describe("describeCurrency", () => {
    it("returns a full descriptor for a known currencyId", () => {
      expect(registry.describeCurrency("polygon")).toEqual({
        currencyId: "polygon",
        family: "ethereum",
        networkId: "137",
        nativeDecimals: 18,
      });
    });

    it("returns undefined for an unknown currencyId", () => {
      expect(registry.describeCurrency("solana")).toBeUndefined();
    });
  });

  describe("describeNetwork", () => {
    it("returns a full descriptor for a known chain ID string", () => {
      expect(registry.describeNetwork("1")).toEqual({
        currencyId: "ethereum",
        family: "ethereum",
        networkId: "1",
        nativeDecimals: 18,
      });
    });

    it("returns undefined for an unknown chain ID", () => {
      expect(registry.describeNetwork("99999")).toBeUndefined();
    });

    it("returns undefined for a non-numeric network ID", () => {
      expect(registry.describeNetwork("mainnet")).toBeUndefined();
    });
  });

  describe("empty registry", () => {
    const empty = new EvmNetworkRegistry([]);

    it("returns undefined for everything", () => {
      expect(empty.getChainIdFromCurrencyId("ethereum")).toBeUndefined();
      expect(empty.getCurrencyIdFromChainId(1)).toBeUndefined();
      expect(empty.isSupportedCurrencyId("ethereum")).toBe(false);
      expect(empty.isSupportedChainId(1)).toBe(false);
      expect(empty.describeCurrency("ethereum")).toBeUndefined();
      expect(empty.describeNetwork("1")).toBeUndefined();
    });
  });
});
