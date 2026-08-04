import type {
  AccountWithFiat,
  Token,
} from "@ledgerhq/ledger-wallet-provider-core";

const NATIVE_CURRENCY_FIAT_THRESHOLD = 0.01;

/**
 * Returns the tokens to display for an account in the UI.
 *
 * The native network currency (e.g. ETH) is included in the display token
 * list when its fiat balance exceeds the threshold. This is
 * a presentation-layer concern only — the underlying account.tokens array
 * intentionally contains ERC-20 tokens only.
 */
export function getDisplayTokens(account: AccountWithFiat): Token[] {
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
