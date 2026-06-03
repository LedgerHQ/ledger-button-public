import { describe, expect, it } from "vitest";

import { normalizeAddressForCurrency } from "./normalizeAddressForCurrency.js";

const EVM_MIXED_CASE_ADDRESS = "0xAbC1234567890aBcDef1234567890ABCDef123456";
const SOLANA_BASE58_ADDRESS = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

describe("normalizeAddressForCurrency", () => {
  it("lowercases EVM addresses", () => {
    expect(normalizeAddressForCurrency(EVM_MIXED_CASE_ADDRESS, "ethereum")).toBe(
      EVM_MIXED_CASE_ADDRESS.toLowerCase(),
    );
  });

  it("preserves Solana base58 addresses untouched", () => {
    expect(
      normalizeAddressForCurrency(SOLANA_BASE58_ADDRESS, "solana"),
    ).toBe(SOLANA_BASE58_ADDRESS);
  });

  it("lowercases addresses for unknown currencies", () => {
    expect(normalizeAddressForCurrency(EVM_MIXED_CASE_ADDRESS, "polygon")).toBe(
      EVM_MIXED_CASE_ADDRESS.toLowerCase(),
    );
  });
});
