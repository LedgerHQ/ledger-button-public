import type { AccountWithFiat } from "@ledgerhq/ledger-wallet-provider-core";

import {
  getAccountFiatValue,
  hasAccountBalanceError,
  hasAccountFiatError,
  isAccountBalanceLoading,
  isAccountFiatLoading,
  sortAccountsByFiatBalance,
} from "./account-helpers.js";

function createAccount(
  overrides: Partial<AccountWithFiat> = {},
): AccountWithFiat {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0xabc123",
    seedIdentifier: "seed-1",
    derivationMode: "",
    index: 0,
    name: "My Ethereum",
    ticker: "ETH",
    balance: "1000000000000000000",
    tokens: [],
    fiatBalance: undefined,
    fiatError: false,
    balanceLoadingState: "loaded",
    fiatLoadingState: "loaded",
    ...overrides,
  };
}

const fiat = (value: string) => ({ value, currency: "USD" });

test("account loading state helpers match the correct state", () => {
  const accounts = [
    createAccount({ id: "loading", balanceLoadingState: "loading", fiatLoadingState: "loading" }),
    createAccount({ id: "error", balanceLoadingState: "error", fiatLoadingState: "error" }),
    createAccount({ id: "loaded", balanceLoadingState: "loaded", fiatLoadingState: "loaded" }),
  ];

  expect(isAccountBalanceLoading(accounts, "loading")).toBe(true);
  expect(isAccountBalanceLoading(accounts, "loaded")).toBe(false);

  expect(hasAccountBalanceError(accounts, "error")).toBe(true);
  expect(hasAccountBalanceError(accounts, "loaded")).toBe(false);

  expect(isAccountFiatLoading(accounts, "loading")).toBe(true);
  expect(isAccountFiatLoading(accounts, "loaded")).toBe(false);

  expect(hasAccountFiatError(accounts, "error")).toBe(true);
  expect(hasAccountFiatError(accounts, "loaded")).toBe(false);
});

test("getAccountFiatValue returns the fiat balance for an account", () => {
  const accounts = [
    createAccount({ id: "a1", fiatBalance: fiat("2500.00") }),
    createAccount({ id: "a2", fiatBalance: undefined }),
  ];

  expect(getAccountFiatValue(accounts, "a1")).toEqual(fiat("2500.00"));
  expect(getAccountFiatValue(accounts, "a2")).toBeUndefined();
  expect(getAccountFiatValue(accounts, "missing")).toBeUndefined();
});

test("sortAccountsByFiatBalance sorts descending and puts missing fiat last", () => {
  const accounts = [
    createAccount({ id: "low", fiatBalance: fiat("100.00") }),
    createAccount({ id: "none", fiatBalance: undefined }),
    createAccount({ id: "high", fiatBalance: fiat("5000.00") }),
  ];

  const result = sortAccountsByFiatBalance(accounts);

  expect(result.map((a) => a.id)).toEqual(["high", "low", "none"]);
  expect(accounts[0].id).toBe("low"); // original not mutated
});
