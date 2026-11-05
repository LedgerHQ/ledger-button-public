import { describe, expect, it } from "vitest";

import {
  createMockCoreFacade,
  XRP_TEST_BLOCKCHAIN_CONFIG,
  XRP_TEST_NETWORK,
} from "./__mocks__/coreFacadeMock";
import {
  XrpBlockchainProvider,
  xrpBlockchainProviderFactory,
} from "./XrpBlockchainProvider";

describe("xrpBlockchainProviderFactory", () => {
  it("creates the provider from the XRP dApp config entry", () => {
    const result = xrpBlockchainProviderFactory(createMockCoreFacade(), [
      XRP_TEST_BLOCKCHAIN_CONFIG,
    ]);

    expect(result.isRight()).toBe(true);
    expect(result.extract()).toBeInstanceOf(XrpBlockchainProvider);
  });

  it("returns the family when the dApp config has no XRP entry", () => {
    const result = xrpBlockchainProviderFactory(createMockCoreFacade(), []);

    expect(result.isLeft()).toBe(true);
    expect(result.extract()).toBe("xrp");
  });
});

describe("XrpBlockchainProvider", () => {
  const createProvider = (networks = XRP_TEST_BLOCKCHAIN_CONFIG.networks) =>
    new XrpBlockchainProvider(createMockCoreFacade(), {
      ...XRP_TEST_BLOCKCHAIN_CONFIG,
      networks,
    });

  describe("describeCurrency", () => {
    it("describes a supported XRP currency", () => {
      expect(createProvider().describeCurrency("ripple")).toEqual({
        currencyId: "ripple",
        family: "xrp",
        networkId: "0",
        nativeDecimals: 6,
      });
    });

    it("describes the XRP testnet currency", () => {
      expect(createProvider().describeCurrency("ripple_testnet")).toEqual({
        currencyId: "ripple_testnet",
        family: "xrp",
        networkId: "1",
        nativeDecimals: 6,
      });
    });

    it("returns undefined for another currency", () => {
      expect(createProvider().describeCurrency("ethereum")).toBeUndefined();
    });
  });

  describe("describeNetwork", () => {
    it("describes a supported network by its XRPL network_id", () => {
      expect(createProvider().describeNetwork("0")).toEqual({
        currencyId: "ripple",
        family: "xrp",
        networkId: "0",
        nativeDecimals: 6,
      });
    });

    it("describes the testnet by its XRPL network_id", () => {
      expect(createProvider().describeNetwork("1")?.currencyId).toBe(
        "ripple_testnet",
      );
    });

    it("returns undefined for a network not in the dApp config", () => {
      expect(createProvider().describeNetwork("2")).toBeUndefined();
      expect(createProvider().describeNetwork("mainnet")).toBeUndefined();
      expect(
        createProvider([XRP_TEST_NETWORK]).describeNetwork("1"),
      ).toBeUndefined();
    });

    it("describes any network the dApp config adds", () => {
      const devnet = {
        id: "2",
        currencyId: "ripple_devnet",
        currencyName: "XRP Devnet",
        currencyTicker: "XRP",
      };

      expect(createProvider([devnet]).describeNetwork("2")).toEqual({
        currencyId: "ripple_devnet",
        family: "xrp",
        networkId: "2",
        nativeDecimals: 6,
      });
    });
  });
});
