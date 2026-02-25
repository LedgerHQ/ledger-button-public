import { describe, expect, it } from "vitest";

import type { AccountWithFiat } from "./service/AccountService.js";
import {
  calculateTotalFiatValue,
  enrichWithLoadingStates,
} from "./accountFiatUtils.js";

function createAccountWithFiat(
  overrides: Partial<AccountWithFiat> = {},
): AccountWithFiat {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0x1234567890abcdef1234567890abcdef12345678",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 0,
    name: "My Ethereum Account",
    ticker: "ETH",
    balance: "1000000000000000000",
    tokens: [],
    fiatBalance: undefined,
    fiatError: false,
    balanceLoadingState: "loaded",
    fiatLoadingState: "loading",
    ...overrides,
  };
}

describe("calculateTotalFiatValue", () => {
  it("should return undefined when total is 0 and account has no fiatBalance", () => {
    const account = createAccountWithFiat({ fiatBalance: undefined });
    expect(calculateTotalFiatValue(account)).toBeUndefined();
  });

  it("should return native fiat only when no tokens", () => {
    const account = createAccountWithFiat({
      fiatBalance: { value: "2000.50", currency: "USD" },
      tokens: [],
    });
    expect(calculateTotalFiatValue(account)).toEqual({
      value: "2000.50",
      currency: "USD",
    });
  });

  it("should sum native and token fiat values", () => {
    const account = createAccountWithFiat({
      fiatBalance: { value: "1000.00", currency: "USD" },
      tokens: [
        {
          ledgerId: "token-1",
          ticker: "USDT",
          name: "Tether",
          balance: "500",
          fiatBalance: { value: "500.25", currency: "USD" },
        },
        {
          ledgerId: "token-2",
          ticker: "USDC",
          name: "USD Coin",
          balance: "200",
          fiatBalance: { value: "200.50", currency: "USD" },
        },
      ],
    });
    expect(calculateTotalFiatValue(account)).toEqual({
      value: "1700.75",
      currency: "USD",
    });
  });

  it("should return tokens fiat only when native has no fiatBalance", () => {
    const account = createAccountWithFiat({
      fiatBalance: undefined,
      tokens: [
        {
          ledgerId: "token-1",
          ticker: "USDT",
          name: "Tether",
          balance: "100",
          fiatBalance: { value: "100.00", currency: "EUR" },
        },
      ],
    });
    expect(calculateTotalFiatValue(account)).toEqual({
      value: "100.00",
      currency: "USD",
    });
  });

  it("should use account fiatBalance currency when present", () => {
    const account = createAccountWithFiat({
      fiatBalance: { value: "500.00", currency: "EUR" },
      tokens: [],
    });
    expect(calculateTotalFiatValue(account)).toEqual({
      value: "500.00",
      currency: "EUR",
    });
  });

  it("should treat tokens with undefined fiatBalance as 0", () => {
    const account = createAccountWithFiat({
      fiatBalance: { value: "100.00", currency: "USD" },
      tokens: [
        {
          ledgerId: "token-1",
          ticker: "USDT",
          name: "Tether",
          balance: "0",
          fiatBalance: undefined,
        },
      ],
    });
    expect(calculateTotalFiatValue(account)).toEqual({
      value: "100.00",
      currency: "USD",
    });
  });
});

describe("enrichWithLoadingStates", () => {
  it("should set balanceLoadingState to loaded when balance is defined", () => {
    const account = enrichWithLoadingStates({
      ...createAccountWithFiat(),
      balance: "100",
      fiatBalance: undefined,
      fiatError: false,
    });
    expect(account.balanceLoadingState).toBe("loaded");
    expect(account.fiatLoadingState).toBe("loading");
  });

  it("should set balanceLoadingState to loading when balance is undefined", () => {
    const account = enrichWithLoadingStates({
      ...createAccountWithFiat(),
      balance: undefined,
      fiatBalance: undefined,
      fiatError: false,
    });
    expect(account.balanceLoadingState).toBe("loading");
  });

  it("should set fiatLoadingState to loaded when fiatBalance is defined", () => {
    const account = enrichWithLoadingStates({
      ...createAccountWithFiat(),
      fiatBalance: { value: "100", currency: "USD" },
      fiatError: false,
    });
    expect(account.fiatLoadingState).toBe("loaded");
  });

  it("should set fiatLoadingState to error when fiatError is true", () => {
    const account = enrichWithLoadingStates({
      ...createAccountWithFiat(),
      fiatBalance: undefined,
      fiatError: true,
    });
    expect(account.fiatLoadingState).toBe("error");
  });
});
