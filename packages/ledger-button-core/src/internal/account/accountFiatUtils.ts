import type {
  Account,
  AccountGroup,
  AccountListItem,
  AccountWithFiat,
  FiatBalance,
  LoadingState,
  Token,
} from "@api/model/Account.js";

const NATIVE_CURRENCY_FIAT_THRESHOLD = 0.01;

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

/**
 * The native network currency (e.g. ETH) is part of the displayed token list
 * only when its fiat balance exceeds the threshold. The underlying
 * `account.tokens` array intentionally contains ERC-20 tokens only.
 */
export function buildDisplayTokens(account: AccountWithFiat): Token[] {
  const fiatValue = parseFloat(account.fiatBalance?.value ?? "0");

  if (fiatValue <= NATIVE_CURRENCY_FIAT_THRESHOLD) {
    return account.tokens;
  }

  const nativeToken: Token = {
    ledgerId: account.currencyId,
    ticker: account.ticker,
    name: account.ticker,
    balance: account.balance ?? "0",
    fiatBalance: account.fiatBalance,
  };

  return [nativeToken, ...account.tokens];
}

export function accountMatchesQuery(
  account: AccountWithFiat,
  query: string,
): boolean {
  const normalized = query.toLowerCase().trim();

  if (!normalized) {
    return true;
  }

  return (
    account.name.toLowerCase().includes(normalized) ||
    account.freshAddress.toLowerCase().includes(normalized) ||
    account.ticker.toLowerCase().includes(normalized) ||
    account.tokens.some(
      (token) =>
        token.ticker.toLowerCase().includes(normalized) ||
        token.name.toLowerCase().includes(normalized),
    )
  );
}

export function toAccountListItem(account: AccountWithFiat): AccountListItem {
  return {
    ...account,
    totalFiatValue: calculateTotalFiatValue(account),
    displayTokens: buildDisplayTokens(account),
  };
}

export function groupAccountsByAddress(
  accounts: AccountListItem[],
): AccountGroup[] {
  const groups = new Map<string, AccountListItem[]>();
  const totals = new Map<string, number>();

  for (const account of accounts) {
    const group = groups.get(account.freshAddress) ?? [];
    group.push(account);
    groups.set(account.freshAddress, group);

    const total = totals.get(account.freshAddress) ?? 0;
    totals.set(
      account.freshAddress,
      total + parseFloat(account.totalFiatValue?.value ?? "0"),
    );
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0))
    .map(([freshAddress, groupAccounts]) => ({
      freshAddress,
      totalFiatValue: buildGroupTotal(
        groupAccounts,
        totals.get(freshAddress) ?? 0,
      ),
      accounts: groupAccounts,
    }));
}

function buildGroupTotal(
  accounts: AccountListItem[],
  total: number,
): FiatBalance | undefined {
  const currency = accounts.find((account) => account.totalFiatValue)
    ?.totalFiatValue?.currency;

  if (!currency) {
    return undefined;
  }

  return { value: total.toFixed(2), currency };
}
