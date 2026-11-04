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

const TESTNET_NETWORK = { ...XRP_TEST_NETWORK, id: "1" };

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

  it("returns the family when the XRP entry has no network", () => {
    const result = xrpBlockchainProviderFactory(createMockCoreFacade(), [
      { ...XRP_TEST_BLOCKCHAIN_CONFIG, networks: [] },
    ]);

    expect(result.isLeft()).toBe(true);
    expect(result.extract()).toBe("xrp");
  });
});

describe("XrpBlockchainProvider", () => {
  const createProvider = (network = XRP_TEST_NETWORK) =>
    new XrpBlockchainProvider(
      createMockCoreFacade(),
      { ...XRP_TEST_BLOCKCHAIN_CONFIG, networks: [network] },
      network,
    );

  describe("describeCurrency", () => {
    it("describes the currency of the configured network", () => {
      expect(
        createProvider(TESTNET_NETWORK).describeCurrency("ripple"),
      ).toEqual({
        currencyId: "ripple",
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
    it("describes the configured network by its XRPL network_id", () => {
      expect(createProvider().describeNetwork("0")).toEqual({
        currencyId: "ripple",
        family: "xrp",
        networkId: "0",
        nativeDecimals: 6,
      });
    });

    it("returns undefined for another network", () => {
      expect(createProvider().describeNetwork("1")).toBeUndefined();
      expect(createProvider().describeNetwork("mainnet")).toBeUndefined();
    });
  });
});
