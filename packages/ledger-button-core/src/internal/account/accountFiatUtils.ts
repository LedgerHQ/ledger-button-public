import type { AccountWithFiat, FiatBalance } from "./service/AccountService.js";

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
