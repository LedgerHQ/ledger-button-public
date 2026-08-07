import { describe, expect, it } from "vitest";

import { EVM_NATIVE_DECIMALS } from "../evm-provider/ledger-eip1193/utils/chainUtils.js";
import { SOLANA_NATIVE_DECIMALS } from "../solana-provider/utils/clusterUtils.js";
import { formatBalance, getDefaultDecimals } from "./currencyUtils.js";

describe("getDefaultDecimals", () => {
  it("should return Solana decimals for a supported Solana currency", () => {
    expect(getDefaultDecimals("solana")).toBe(SOLANA_NATIVE_DECIMALS);
  });

  it("should return EVM decimals for a supported EVM currency", () => {
    expect(getDefaultDecimals("ethereum")).toBe(EVM_NATIVE_DECIMALS);
  });

  it("should return EVM decimals for an unknown currency", () => {
    expect(getDefaultDecimals("unknown_currency")).toBe(EVM_NATIVE_DECIMALS);
  });
});

describe("formatBalance", () => {
  describe("basic formatting", () => {
    it("should format 1 ETH correctly (no code by default)", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH", "ethereum");
      expect(result).toBe("1");
    });

    it("should format a fractional ETH value", () => {
      const result = formatBalance(BigInt("500000000000000000"), 18, "ETH", "ethereum");
      expect(result).toBe("0.5");
    });

    it("should format zero ETH balance", () => {
      const result = formatBalance(BigInt("0"), 18, "ETH", "ethereum");
      expect(result).toBe("0");
    });

    it("should accept a string raw balance", () => {
      const result = formatBalance("1000000000000000000", 18, "ETH", "ethereum");
      expect(result).toBe("1");
    });

    it("should format 1 SOL correctly", () => {
      const result = formatBalance(BigInt("1000000000"), 9, "SOL", "solana");
      expect(result).toBe("1");
    });

    it("should format a fractional SOL value", () => {
      const result = formatBalance(BigInt("500000000"), 9, "SOL", "solana");
      expect(result).toBe("0.5");
    });

    it("should format zero SOL balance", () => {
      const result = formatBalance(BigInt("0"), 9, "SOL", "solana");
      expect(result).toBe("0");
    });

    it("should format a non-round ETH value", () => {
      const result = formatBalance(BigInt("93229707264"), 18, "ETH", "ethereum");
      expect(result).toBe("0.00000009");
    });

    it("should format a non-round SOL value", () => {
      const result = formatBalance(BigInt("93229707264"), 9, "SOL", "solana");
      expect(result).toBe("93.2297");
    });

    it("should format a non-round ETH value when decimals is undefined", () => {
      const result = formatBalance(BigInt("93229707264"), undefined, "ETH", "ethereum");
      expect(result).toBe("0.00000009");
    });

    it("should format a non-round SOL value when decimals is undefined", () => {
      const result = formatBalance(BigInt("93229707264"), undefined, "SOL", "solana");
      expect(result).toBe("93.2297");
    });
  });

  describe("decimals", () => {
    it("should handle 6 decimals (e.g. USDC)", () => {
      const result = formatBalance(BigInt("1000000"), 6, "USDC", "ethereum");
      expect(result).toBe("1");
    });

    it("should handle 0 decimals", () => {
      const result = formatBalance(BigInt("42"), 0, "WEI", "ethereum");
      expect(result).toBe("42");
    });

    it("should fall back to EVM decimals when decimals is undefined for an EVM currency", () => {
      const result = formatBalance(BigInt("1000000000000000000"), undefined, "ETH", "ethereum");
      expect(result).toBe("1");
    });

    it("should fall back to Solana decimals when decimals is undefined for a Solana currency", () => {
      const result = formatBalance(BigInt("1000000000"), undefined, "SOL", "solana");
      expect(result).toBe("1");
    });
  });

  describe("options", () => {
    it("should show the ticker code when showCode is true", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH", "ethereum", {
        showCode: true,
      });
      expect(result).toBe("1 ETH");
    });

    it("should not show the code when showCode is false", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH", "ethereum", {
        showCode: false,
      });
      expect(result).toBe("1");
    });

    it("should show full precision when disableRounding is true", () => {
      const result = formatBalance(BigInt("93229707264"), 18, "DAI", "ethereum", {
        disableRounding: true,
      });
      expect(result).toBe("0.000000093229707264");
    });

    it("should show all digits when showAllDigits is true", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH", "ethereum", {
        showAllDigits: true,
      });
      expect(result).toBe("1.000000000000000000");
    });

    it("should combine showCode and showAllDigits", () => {
      const result = formatBalance(BigInt("1000000000000000000"), 18, "ETH", "ethereum", {
        showCode: true,
        showAllDigits: true,
      });
      expect(result).toBe("1.000000000000000000 ETH");
    });
  });
});
