import { describe, expect, it } from "vitest";

import { formatBalance, UNRESOLVED_DECIMALS } from "./currencyUtils";

describe("formatBalance", () => {
  describe("basic formatting", () => {
    it("should format 1 ETH correctly (no code by default)", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH");
      expect(result).toBe("1");
    });

    it("should format a fractional ETH value", () => {
      const result = formatBalance(BigInt("500000000000000000"), 18, "ETH");
      expect(result).toBe("0.5");
    });

    it("should format zero ETH balance", () => {
      const result = formatBalance(BigInt("0"), 18, "ETH");
      expect(result).toBe("0");
    });

    it("should accept a string raw balance", () => {
      const result = formatBalance("1000000000000000000", 18, "ETH");
      expect(result).toBe("1");
    });

    it("should format 1 SOL correctly", () => {
      const result = formatBalance(BigInt("1000000000"), 9, "SOL");
      expect(result).toBe("1");
    });

    it("should format a fractional SOL value", () => {
      const result = formatBalance(BigInt("500000000"), 9, "SOL");
      expect(result).toBe("0.5");
    });

    it("should format zero SOL balance", () => {
      const result = formatBalance(BigInt("0"), 9, "SOL");
      expect(result).toBe("0");
    });

    it("should format a non-round ETH value", () => {
      const result = formatBalance(BigInt("93229707264"), 18, "ETH");
      expect(result).toBe("0.00000009");
    });

    it("should format a non-round SOL value", () => {
      const result = formatBalance(BigInt("93229707264"), 9, "SOL");
      expect(result).toBe("93.2297");
    });
  });

  describe("decimals", () => {
    it("should handle 6 decimals (e.g. USDC)", () => {
      const result = formatBalance(BigInt("1000000"), 6, "USDC");
      expect(result).toBe("1");
    });

    it("should handle 0 decimals", () => {
      const result = formatBalance(BigInt("42"), 0, "WEI");
      expect(result).toBe("42");
    });

    it("should render the unscaled value with UNRESOLVED_DECIMALS", () => {
      const result = formatBalance(
        BigInt("93229707264"),
        UNRESOLVED_DECIMALS,
        "SOL",
      );
      expect(result).toBe("93,229,707,264");
    });
  });

  describe("options", () => {
    it("should show the ticker code when showCode is true", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH", {
        showCode: true,
      });
      expect(result).toBe("1 ETH");
    });

    it("should not show the code when showCode is false", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH", {
        showCode: false,
      });
      expect(result).toBe("1");
    });

    it("should show full precision when disableRounding is true", () => {
      const result = formatBalance(BigInt("93229707264"), 18, "DAI", {
        disableRounding: true,
      });
      expect(result).toBe("0.000000093229707264");
    });

    it("should show all digits when showAllDigits is true", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH", {
        showAllDigits: true,
      });
      expect(result).toBe("1.000000000000000000");
    });

    it("should combine showCode and showAllDigits", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH", {
        showCode: true,
        showAllDigits: true,
      });
      expect(result).toBe("1.000000000000000000 ETH");
    });
  });
});
