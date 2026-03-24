import type { AccountWithFiat } from "@ledgerhq/ledger-wallet-provider-core";

export function isAccountBalanceLoading(
  accounts: AccountWithFiat[],
  accountId: string,
): boolean {
  const account = accounts.find((acc) => acc.id === accountId);
  return account?.balanceLoadingState === "loading";
}

export function hasAccountBalanceError(
  accounts: AccountWithFiat[],
  accountId: string,
): boolean {
  const account = accounts.find((acc) => acc.id === accountId);
  return account?.balanceLoadingState === "error";
}

export function isAccountFiatLoading(
  accounts: AccountWithFiat[],
  accountId: string,
): boolean {
  const account = accounts.find((acc) => acc.id === accountId);
  return account?.fiatLoadingState === "loading";
}

export function hasAccountFiatError(
  accounts: AccountWithFiat[],
  accountId: string,
): boolean {
  const account = accounts.find((acc) => acc.id === accountId);
  return account?.fiatLoadingState === "error";
}

export function getAccountFiatValue(
  accounts: AccountWithFiat[],
  accountId: string,
) {
  return accounts.find((acc) => acc.id === accountId)?.fiatBalance;
}

export function sortAccountsByFiatBalance(
  accounts: AccountWithFiat[],
): AccountWithFiat[] {
  return [...accounts].sort((a, b) => {
    const aValue = a.fiatBalance ? parseFloat(a.fiatBalance.value) : 0;
    const bValue = b.fiatBalance ? parseFloat(b.fiatBalance.value) : 0;
    return bValue - aValue;
  });
}
