import type { FiatBalance } from "@ledgerhq/ledger-wallet-provider-core";
import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE } from "../context/constants/languages.js";
import { formatFiatBalance, formatFiatValue } from "./format-fiat.js";

describe("formatFiatValue", () => {
  describe("ISO 4217 currency codes (en-US)", () => {
    it("formats USD with grouping and cents", () => {
      expect(formatFiatValue(1234.56, "USD", "en-US")).toBe("$1,234.56");
    });

    it("formats EUR with the euro symbol", () => {
      expect(formatFiatValue(42.1, "EUR", "en-US")).toBe("€42.10");
    });

    it("formats GBP with the pound symbol", () => {
      expect(formatFiatValue(99.99, "GBP", "en-US")).toBe("£99.99");
    });
  });

  describe("locale formatting", () => {
    it("uses fr-FR grouping and spacing for USD", () => {
      expect(formatFiatValue(1234.56, "USD", "fr-FR")).toBe(
        "1\u202f234,56\u00a0$",
      );
    });

    it("uses fr-FR decimal separator and non-breaking space before euro", () => {
      expect(formatFiatValue(42.1, "EUR", "fr-FR")).toBe("42,10\u00a0€");
    });

    it("uses fr-FR decimal separator and non-breaking space before pound", () => {
      expect(formatFiatValue(99.99, "GBP", "fr-FR")).toBe("99,99\u00a0£");
    });
  });

  describe("value input", () => {
    it("accepts string amounts", () => {
      expect(formatFiatValue("1234.56", "USD", "en-US")).toBe("$1,234.56");
    });

    it("formats zero", () => {
      expect(formatFiatValue(0, "USD", "en-US")).toBe("$0.00");
    });
  });

  describe("defaults", () => {
    it("uses USD and DEFAULT_LOCALE when only value is passed", () => {
      expect(formatFiatValue(100)).toBe(
        formatFiatValue(100, "USD", DEFAULT_LOCALE),
      );
    });

    it("uses DEFAULT_LOCALE when currency is passed but locale is omitted", () => {
      expect(formatFiatValue(50.25, "EUR")).toBe(
        formatFiatValue(50.25, "EUR", DEFAULT_LOCALE),
      );
    });
  });
});

describe("formatFiatBalance", () => {
  it("returns empty string when balance is undefined", () => {
    expect(formatFiatBalance(undefined, "en-US")).toBe("");
  });

  it("formats value and currency with the given locale", () => {
    const balance: FiatBalance = { value: "1234.56", currency: "USD" };
    expect(formatFiatBalance(balance, "en-US")).toBe(
      formatFiatValue("1234.56", "USD", "en-US"),
    );
  });
});
