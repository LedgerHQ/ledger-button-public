import { describe, expect, it } from "vitest";

import {
  getLedgerNanoSUpgradeUrl,
  getLedgerWalletDownloadUrl,
  getReferralShopUrl,
  getShopUrl,
} from "./shop-urls.js";

describe("getShopUrl", () => {
  describe("page URLs", () => {
    it("builds English page URLs without a language prefix", () => {
      expect(
        getShopUrl({ language: "en", page: "ledger-wallet-download" }),
      ).toBe("https://shop.ledger.com/pages/ledger-wallet-download");
    });

    it("builds localized page URLs with a language prefix", () => {
      expect(
        getShopUrl({ language: "fr", page: "ledger-wallet-download" }),
      ).toBe("https://shop.ledger.com/fr/pages/ledger-wallet-download");
    });

    it("supports other Button languages", () => {
      expect(
        getShopUrl({ language: "de", page: "hardware-wallets-comparison" }),
      ).toBe("https://shop.ledger.com/de/pages/hardware-wallets-comparison");
    });

    it("accepts page slugs already prefixed with pages/", () => {
      expect(
        getShopUrl({ language: "fr", page: "pages/ledger-wallet-download" }),
      ).toBe("https://shop.ledger.com/fr/pages/ledger-wallet-download");
    });

    it("appends query parameters to page URLs", () => {
      expect(
        getShopUrl({
          language: "fr",
          page: "ledger-nano-s-upgrade-program",
          search: "utm_source=support",
        }),
      ).toBe(
        "https://shop.ledger.com/fr/pages/ledger-nano-s-upgrade-program?utm_source=support",
      );
    });

    it("accepts query parameters starting with ?", () => {
      expect(
        getShopUrl({
          language: "fr",
          page: "ledger-wallet-download",
          search: "?foo=bar",
        }),
      ).toBe("https://shop.ledger.com/fr/pages/ledger-wallet-download?foo=bar");
    });
  });

  describe("root URLs", () => {
    it("builds English root URLs with query parameters", () => {
      expect(
        getShopUrl({ language: "en", search: "referral=uuid-of-the-dapp" }),
      ).toBe("https://shop.ledger.com?referral=uuid-of-the-dapp");
    });

    it("builds localized root URLs with query parameters", () => {
      expect(
        getShopUrl({ language: "fr", search: "referral=uuid-of-the-dapp" }),
      ).toBe("https://shop.ledger.com/fr?referral=uuid-of-the-dapp");
    });

    it("builds localized root URLs without query parameters", () => {
      expect(getShopUrl({ language: "fr" })).toBe("https://shop.ledger.com/fr");
    });
  });
});

describe("getReferralShopUrl", () => {
  describe("backend page referral URLs", () => {
    it("localizes the hardware wallets comparison page from dApp config", () => {
      expect(
        getReferralShopUrl(
          "https://shop.ledger.com/pages/hardware-wallets-comparison",
          "fr",
        ),
      ).toBe("https://shop.ledger.com/fr/pages/hardware-wallets-comparison");
    });

    it("keeps English page referral URLs unchanged", () => {
      expect(
        getReferralShopUrl(
          "https://shop.ledger.com/pages/hardware-wallets-comparison",
          "en",
        ),
      ).toBe("https://shop.ledger.com/pages/hardware-wallets-comparison");
    });
  });

  describe("backend root referral URLs", () => {
    it("localizes referral URLs with a query parameter only", () => {
      expect(
        getReferralShopUrl(
          "https://shop.ledger.com?referral=uuid-of-the-dapp",
          "fr",
        ),
      ).toBe("https://shop.ledger.com/fr?referral=uuid-of-the-dapp");
    });

    it("keeps English root referral URLs unchanged", () => {
      expect(
        getReferralShopUrl(
          "https://shop.ledger.com?referral=uuid-of-the-dapp",
          "en",
        ),
      ).toBe("https://shop.ledger.com?referral=uuid-of-the-dapp");
    });
  });
});

describe("getLedgerWalletDownloadUrl", () => {
  it("returns the English wallet download URL", () => {
    expect(getLedgerWalletDownloadUrl("en")).toBe(
      "https://shop.ledger.com/pages/ledger-wallet-download",
    );
  });

  it("returns the localized wallet download URL", () => {
    expect(getLedgerWalletDownloadUrl("fr")).toBe(
      "https://shop.ledger.com/fr/pages/ledger-wallet-download",
    );
  });
});

describe("getLedgerNanoSUpgradeUrl", () => {
  it("returns the English Nano S upgrade URL with tracking params", () => {
    expect(getLedgerNanoSUpgradeUrl("en")).toBe(
      "https://shop.ledger.com/pages/ledger-nano-s-upgrade-program?utm_source=support",
    );
  });

  it("returns the localized Nano S upgrade URL with tracking params", () => {
    expect(getLedgerNanoSUpgradeUrl("fr")).toBe(
      "https://shop.ledger.com/fr/pages/ledger-nano-s-upgrade-program?utm_source=support",
    );
  });
});
