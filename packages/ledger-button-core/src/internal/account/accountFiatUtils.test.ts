import { describe, expect, it } from "vitest";

import type { AccountWithFiat } from "@api/model/Account.js";

import {
  accountMatchesQuery,
  buildDisplayTokens,
  calculateTotalFiatValue,
  enrichWithLoadingStates,
  groupAccountsByAddress,
  toAccountListItem,
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

describe("buildDisplayTokens", () => {
  const usdt = {
    ledgerId: "ethereum/erc20/usdt",
    ticker: "USDT",
    name: "Tether",
    balance: "50000000",
    fiatBalance: { value: "50.00", currency: "USD" },
  };

  it("should prepend the native currency when its fiat value is above the threshold", () => {
    const account = createAccountWithFiat({
      fiatBalance: { value: "1200.00", currency: "USD" },
      tokens: [usdt],
    });

    expect(buildDisplayTokens(account)).toEqual([
      {
        ledgerId: "ethereum",
        ticker: "ETH",
        name: "ETH",
        balance: "1000000000000000000",
        fiatBalance: { value: "1200.00", currency: "USD" },
      },
      usdt,
    ]);
  });

  it("should omit the native currency when its fiat value is at or below the threshold", () => {
    const account = createAccountWithFiat({
      fiatBalance: { value: "0.01", currency: "USD" },
      tokens: [usdt],
    });

    expect(buildDisplayTokens(account)).toEqual([usdt]);
  });

  it("should omit the native currency when fiat is not hydrated yet", () => {
    const account = createAccountWithFiat({
      fiatBalance: undefined,
      tokens: [usdt],
    });

    expect(buildDisplayTokens(account)).toEqual([usdt]);
  });

  it("should default the native balance to 0 when the balance is unknown", () => {
    const account = createAccountWithFiat({
      balance: undefined,
      fiatBalance: { value: "5.00", currency: "USD" },
      tokens: [],
    });

    expect(buildDisplayTokens(account)[0]?.balance).toBe("0");
  });
});

describe("accountMatchesQuery", () => {
  const account = createAccountWithFiat({
    name: "My Ethereum Account",
    freshAddress: "0xC5aB1234567890abcdef1234567890abcdefA470",
    ticker: "ETH",
    tokens: [
      {
        ledgerId: "ethereum/erc20/usdt",
        ticker: "USDT",
        name: "Tether",
        balance: "1",
        fiatBalance: undefined,
      },
    ],
  });

  it("should match every account on an empty or blank query", () => {
    expect(accountMatchesQuery(account, "")).toBe(true);
    expect(accountMatchesQuery(account, "   ")).toBe(true);
  });

  it("should match on name, address and ticker, case insensitively", () => {
    expect(accountMatchesQuery(account, "ETHEREUM ACC")).toBe(true);
    expect(accountMatchesQuery(account, "0xc5ab")).toBe(true);
    expect(accountMatchesQuery(account, "eth")).toBe(true);
  });

  it("should match on token ticker and token name", () => {
    expect(accountMatchesQuery(account, "usdt")).toBe(true);
    expect(accountMatchesQuery(account, "tether")).toBe(true);
  });

  it("should not match an unrelated query", () => {
    expect(accountMatchesQuery(account, "solana")).toBe(false);
  });
});

describe("groupAccountsByAddress", () => {
  function listItem(overrides: Partial<AccountWithFiat>) {
    return toAccountListItem(createAccountWithFiat(overrides));
  }

  it("should group accounts sharing the same address", () => {
    const groups = groupAccountsByAddress([
      listItem({ id: "a", freshAddress: "0xaaa", currencyId: "ethereum" }),
      listItem({ id: "b", freshAddress: "0xaaa", currencyId: "polygon" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.freshAddress).toBe("0xaaa");
    expect(groups[0]?.accounts.map((account) => account.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("should sort groups by their total fiat value, descending", () => {
    const groups = groupAccountsByAddress([
      listItem({
        freshAddress: "0xsmall",
        fiatBalance: { value: "10.00", currency: "USD" },
      }),
      listItem({
        freshAddress: "0xbig",
        fiatBalance: { value: "900.00", currency: "USD" },
      }),
    ]);

    expect(groups.map((group) => group.freshAddress)).toEqual([
      "0xbig",
      "0xsmall",
    ]);
  });

  it("should sum the fiat value of every account in the group", () => {
    const groups = groupAccountsByAddress([
      listItem({
        freshAddress: "0xaaa",
        fiatBalance: { value: "100.50", currency: "USD" },
      }),
      listItem({
        freshAddress: "0xaaa",
        fiatBalance: { value: "20.25", currency: "USD" },
      }),
    ]);

    expect(groups[0]?.totalFiatValue).toEqual({
      value: "120.75",
      currency: "USD",
    });
  });

  it("should leave the group total undefined while no account has fiat", () => {
    const groups = groupAccountsByAddress([
      listItem({ freshAddress: "0xaaa", fiatBalance: undefined, tokens: [] }),
    ]);

    expect(groups[0]?.totalFiatValue).toBeUndefined();
  });

  it("should return an empty array when there is no account", () => {
    expect(groupAccountsByAddress([])).toEqual([]);
  });
});
