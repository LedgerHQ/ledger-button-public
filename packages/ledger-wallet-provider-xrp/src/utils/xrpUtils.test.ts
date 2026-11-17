import { describe, expect, it } from "vitest";

import {
  XRP_TEST_ACCOUNT,
  XRP_TEST_NETWORK,
  XRP_TEST_NETWORKS,
  XRP_TESTNET_TEST_NETWORK,
} from "../__mocks__/coreFacadeMock";
import {
  describeXrpCurrency,
  describeXrpNetwork,
  findXrpNetworkByCurrencyId,
  findXrpNetworkById,
  getXrpDerivationPath,
} from "./xrpUtils";

describe("getXrpDerivationPath", () => {
  it("derives the BIP44 path from the account index", () => {
    expect(getXrpDerivationPath(XRP_TEST_ACCOUNT)).toBe("44'/144'/0'/0/0");
    expect(getXrpDerivationPath({ ...XRP_TEST_ACCOUNT, index: 3 })).toBe(
      "44'/144'/3'/0/0",
    );
  });
});

describe("findXrpNetworkByCurrencyId", () => {
  it("finds the network of a configured currency", () => {
    expect(findXrpNetworkByCurrencyId(XRP_TEST_NETWORKS, "ripple")).toBe(
      XRP_TEST_NETWORK,
    );
    expect(
      findXrpNetworkByCurrencyId(XRP_TEST_NETWORKS, "ripple_testnet"),
    ).toBe(XRP_TESTNET_TEST_NETWORK);
  });

  it("returns undefined for a currency missing from the config", () => {
    expect(
      findXrpNetworkByCurrencyId(XRP_TEST_NETWORKS, "ripple_devnet"),
    ).toBeUndefined();
    expect(findXrpNetworkByCurrencyId([], "ripple")).toBeUndefined();
  });
});

describe("findXrpNetworkById", () => {
  it("finds a configured network by its XRPL network_id", () => {
    expect(findXrpNetworkById(XRP_TEST_NETWORKS, "0")).toBe(XRP_TEST_NETWORK);
    expect(findXrpNetworkById(XRP_TEST_NETWORKS, "1")).toBe(
      XRP_TESTNET_TEST_NETWORK,
    );
  });

  it("returns undefined for a network missing from the config", () => {
    expect(findXrpNetworkById(XRP_TEST_NETWORKS, "2")).toBeUndefined();
    expect(findXrpNetworkById(XRP_TEST_NETWORKS, "ripple")).toBeUndefined();
  });
});

describe("describeXrpCurrency", () => {
  it("describes a configured currency with its network_id", () => {
    expect(describeXrpCurrency(XRP_TEST_NETWORKS, "ripple_testnet")).toEqual({
      currencyId: "ripple_testnet",
      family: "xrp",
      networkId: "1",
      nativeDecimals: 6,
    });
  });

  it("returns undefined for a currency missing from the config", () => {
    expect(describeXrpCurrency(XRP_TEST_NETWORKS, "ethereum")).toBeUndefined();
    expect(describeXrpCurrency([], "ripple")).toBeUndefined();
  });
});

describe("describeXrpNetwork", () => {
  it("describes a configured network by its network_id", () => {
    expect(describeXrpNetwork(XRP_TEST_NETWORKS, "0")).toEqual({
      currencyId: "ripple",
      family: "xrp",
      networkId: "0",
      nativeDecimals: 6,
    });
  });

  it("returns undefined for a network missing from the config", () => {
    expect(describeXrpNetwork(XRP_TEST_NETWORKS, "2")).toBeUndefined();
    expect(describeXrpNetwork([], "0")).toBeUndefined();
  });
});
