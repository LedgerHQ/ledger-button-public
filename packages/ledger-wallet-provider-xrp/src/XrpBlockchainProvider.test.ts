import { describe, expect, it } from "vitest";

import {
  createMockCoreFacade,
  XRP_TEST_BLOCKCHAIN_CONFIG,
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
  const createProvider = () =>
    new XrpBlockchainProvider(
      createMockCoreFacade(),
      XRP_TEST_BLOCKCHAIN_CONFIG,
    );

  describe("describeCurrency", () => {
    it("describes a supported XRP currency", () => {
      expect(createProvider().describeCurrency("ripple")).toEqual({
        currencyId: "ripple",
        family: "xrp",
        networkId: "0",
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

    it("returns undefined for an unmapped network", () => {
      expect(createProvider().describeNetwork("1")).toBeUndefined();
      expect(createProvider().describeNetwork("mainnet")).toBeUndefined();
    });
  });
});
