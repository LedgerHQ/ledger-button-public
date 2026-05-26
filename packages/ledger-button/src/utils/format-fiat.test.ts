import type { FiatBalance } from "@ledgerhq/ledger-wallet-provider-core";
import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE } from "../context/constants/languages.js";
import {
  formatFiatBalance,
  formatFiatValue,
  formatTokenBalance,
} from "./format-fiat.js";

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

describe("formatTokenBalance", () => {
  describe("locale formatting", () => {
    it("uses dot as decimal separator in en-US", () => {
      expect(formatTokenBalance("0.01", "en-US")).toBe("0.01");
    });

    it("uses comma as decimal separator in fr-FR", () => {
      expect(formatTokenBalance("0.01", "fr-FR")).toBe("0,01");
    });

    it("uses grouping separator in en-US for large numbers", () => {
      expect(formatTokenBalance("1234567.89", "en-US")).toBe("1,234,567.89");
    });

    it("uses grouping separator in fr-FR for large numbers", () => {
      expect(formatTokenBalance("1234567.89", "fr-FR")).toBe(
        "1\u202f234\u202f567,89",
      );
    });
  });

  describe("precision", () => {
    it("preserves up to 8 decimal places", () => {
      expect(formatTokenBalance("0.12345678", "en-US")).toBe("0.12345678");
    });

    it("trims trailing zeros beyond significant digits", () => {
      expect(formatTokenBalance("1.10000000", "en-US")).toBe("1.1");
    });

    it("formats zero", () => {
      expect(formatTokenBalance("0", "en-US")).toBe("0");
    });
  });

  describe("negative numbers", () => {
    it("uses dot as decimal separator in en-US", () => {
      expect(formatTokenBalance("-0.01", "en-US")).toBe("-0.01");
    });

    it("uses comma as decimal separator in fr-FR", () => {
      expect(formatTokenBalance("-0.01", "fr-FR")).toBe("-0,01");
    });

    it("uses grouping separator in en-US for large numbers", () => {
      expect(formatTokenBalance("-1234567.89", "en-US")).toBe("-1,234,567.89");
    });

    it("uses grouping separator in fr-FR for large numbers", () => {
      expect(formatTokenBalance("-1234567.89", "fr-FR")).toBe(
        "-1\u202f234\u202f567,89",
      );
    });

    it("preserves up to 8 decimal places", () => {
      expect(formatTokenBalance("-0.12345678", "en-US")).toBe("-0.12345678");
    });

    it("trims trailing zeros beyond significant digits", () => {
      expect(formatTokenBalance("-1.10000000", "en-US")).toBe("-1.1");
    });
  });

  describe("edge cases", () => {
    it("returns the raw string when value is not a valid number", () => {
      expect(formatTokenBalance("not-a-number", "en-US")).toBe("not-a-number");
    });

    it("uses DEFAULT_LOCALE when locale is omitted", () => {
      expect(formatTokenBalance("1.5")).toBe(
        formatTokenBalance("1.5", DEFAULT_LOCALE),
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
