import type {
  Account,
  AccountWithFiat,
  FiatBalance,
  LoadingState,
  Network,
} from "@api/model/Account.js";

export function computeNetworks(
  account: AccountWithFiat,
  resolveNetworkId: (currencyId: string) => string | undefined,
): Network[] {
  const currency = account.fiatBalance?.currency ?? "USD";
  const nativeFiat = account.fiatBalance?.value
    ? parseFloat(account.fiatBalance.value)
    : 0;

  const allEntries: [string, number][] = [
    [account.currencyId, nativeFiat],
    ...account.tokens.map((token): [string, number] => {
      const chainCurrencyId = token.ledgerId.includes("/")
        ? (token.ledgerId.split("/")[0] ?? account.currencyId)
        : account.currencyId;
      const tokenFiat = token.fiatBalance?.value
        ? parseFloat(token.fiatBalance.value)
        : 0;
      return [chainCurrencyId, tokenFiat];
    }),
  ];

  const networkFiatMap = allEntries.reduce<
    Map<string, { name: string; totalFiat: number }>
  >((acc, [currencyId, fiatValue]) => {
    const networkId = resolveNetworkId(currencyId);

    if (!networkId) {
      return acc;
    }

    const existing = acc.get(networkId);

    return acc.set(networkId, {
      name: currencyId,
      totalFiat: (existing?.totalFiat ?? 0) + fiatValue,
    });
  }, new Map());

  return Array.from(networkFiatMap.entries())
    .sort((a, b) => b[1].totalFiat - a[1].totalFiat)
    .map(([id, { name, totalFiat }]) => ({
      id,
      name,
      fiatBalance:
        totalFiat > 0 ? { value: totalFiat.toFixed(2), currency } : undefined,
    }));
}

export function enrichWithLoadingStates(
  account: Account & { fiatBalance?: FiatBalance; fiatError?: boolean },
): AccountWithFiat {
  const balanceLoadingState: LoadingState =
    account.balance !== undefined ? "loaded" : "loading";
  const fiatLoadingState: LoadingState = account.fiatError
    ? "error"
    : account.fiatBalance !== undefined
      ? "loaded"
      : "loading";

  return {
    ...account,
    fiatBalance: account.fiatBalance,
    fiatError: account.fiatError ?? false,
    balanceLoadingState,
    fiatLoadingState,
  };
}

export function calculateTotalFiatValue(
  account: AccountWithFiat,
): FiatBalance | undefined {
  const nativeFiatValue = account.fiatBalance?.value
    ? parseFloat(account.fiatBalance.value)
    : 0;

  const tokensFiatValue = account.tokens.reduce((sum, token) => {
    const tokenFiat = token.fiatBalance?.value
      ? parseFloat(token.fiatBalance.value)
      : 0;
    return sum + tokenFiat;
  }, 0);

  const totalValue = nativeFiatValue + tokensFiatValue;

  if (totalValue === 0 && !account.fiatBalance) {
    return undefined;
  }

  const currency = account.fiatBalance?.currency ?? "USD";

  return {
    value: totalValue.toFixed(2),
    currency,
  };
}
