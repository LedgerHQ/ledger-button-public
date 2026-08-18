import { describe, expect, test } from "vitest";

import { buildAccountDeepLink, buildWalletActionDeepLink } from "./deeplinks";

describe("buildWalletActionDeepLink", () => {
  describe("without partner", () => {
    test("returns base URL when no context", () => {
      expect(buildWalletActionDeepLink("swap")).toBe("ledgerwallet://swap");
      expect(buildWalletActionDeepLink("send")).toBe("ledgerwallet://send");
      expect(buildWalletActionDeepLink("buy")).toBe("ledgerwallet://buy");
    });

    test("appends currency params when context has currency", () => {
      expect(buildWalletActionDeepLink("send", { currency: "eth" })).toBe(
        "ledgerwallet://send?currency=eth",
      );
      expect(buildWalletActionDeepLink("swap", { currency: "usdc" })).toBe(
        "ledgerwallet://swap?fromToken=usdc",
      );
      expect(buildWalletActionDeepLink("earn", { currency: "btc" })).toBe(
        "ledgerwallet://earn?cryptoAssetId=btc",
      );
    });
  });

  describe("with partner", () => {
    test("appends tracking query params with fixed deeplinkType and deeplinkChannel", () => {
      const url = buildWalletActionDeepLink("swap", undefined, "MyPartner");
      expect(url).toContain("deeplinkType=Internal");
      expect(url).toContain("deeplinkChannel=Button");
      expect(url).toContain("deeplinkDestination=swap");
      expect(url).toContain("deeplinkButtonPartner=MyPartner");
    });

    test("maps each action to correct deeplinkDestination (same as route)", () => {
      const partner = "Partner";
      expect(buildWalletActionDeepLink("send", undefined, partner)).toContain(
        "deeplinkDestination=send",
      );
      expect(buildWalletActionDeepLink("receive", undefined, partner)).toContain(
        "deeplinkDestination=receive",
      );
      expect(buildWalletActionDeepLink("swap", undefined, partner)).toContain(
        "deeplinkDestination=swap",
      );
      expect(buildWalletActionDeepLink("buy", undefined, partner)).toContain(
        "deeplinkDestination=buy",
      );
      expect(buildWalletActionDeepLink("earn", undefined, partner)).toContain(
        "deeplinkDestination=earn",
      );
      expect(buildWalletActionDeepLink("sell", undefined, partner)).toContain(
        "deeplinkDestination=buy",
      );
    });

    test("preserves existing currency params when partner is provided", () => {
      const url = buildWalletActionDeepLink(
        "swap",
        { currency: "eth" },
        "MyPartner",
      );
      expect(url).toContain("fromToken=eth");
      expect(url).toContain("deeplinkType=Internal");
      expect(url).toContain("deeplinkButtonPartner=MyPartner");
    });

    test("URL-encodes partner with special characters", () => {
      const url = buildWalletActionDeepLink("buy", undefined, "Partner & Co");
      expect(url).toContain("deeplinkButtonPartner=Partner+%26+Co");
    });
  });
});

describe("buildAccountDeepLink", () => {
  describe("without partner", () => {
    test("returns base URL when no context", () => {
      expect(buildAccountDeepLink({})).toBe("ledgerwallet://account");
    });

    test("appends currency and address params when context is provided", () => {
      expect(
        buildAccountDeepLink({
          currency: "ethereum",
          address: "0x1234",
        }),
      ).toBe("ledgerwallet://account?currency=ethereum&address=0x1234");
    });

    test("appends only currency when address is omitted", () => {
      expect(buildAccountDeepLink({ currency: "bitcoin" })).toBe(
        "ledgerwallet://account?currency=bitcoin",
      );
    });
  });

  describe("with partner", () => {
    test("appends tracking query params with deeplinkDestination=account", () => {
      const url = buildAccountDeepLink(
        { currency: "ethereum", address: "0x1234" },
        "MyPartner",
      );
      expect(url).toContain("currency=ethereum");
      expect(url).toContain("address=0x1234");
      expect(url).toContain("deeplinkType=Internal");
      expect(url).toContain("deeplinkChannel=Button");
      expect(url).toContain("deeplinkDestination=account");
      expect(url).toContain("deeplinkButtonPartner=MyPartner");
    });
  });
});
