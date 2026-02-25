import type { FiatBalance } from "@ledgerhq/ledger-wallet-provider-core";

/**
 * Formats a numeric value as a fiat currency string using the user's browser locale.
 *
 * @param value - The fiat amount (e.g., 1234.56)
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "EUR", "GBP")
 * @returns The formatted fiat string (e.g., "$1,234.56" for en-US, "1 234,56 $US" for fr-FR)
 *
 * @example
 * formatFiatValue(1234.56, "USD") // "$1,234.56" (en-US) or "1 234,56 $US" (fr-FR)
 *
 * @example
 * formatFiatValue(42.1, "EUR") // "€42.10" (en-US) or "42,10 €" (fr-FR)
 */
export function formatFiatValue(
  value: number | string,
  currencyCode = "USD",
): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(Number(value));
}

/**
 * Formats a FiatBalance as a currency string. Returns empty string when undefined.
 */
export function formatFiatBalance(
  fiatBalance: FiatBalance | undefined,
): string {
  if (!fiatBalance) return "";
  return formatFiatValue(fiatBalance.value, fiatBalance.currency);
}
