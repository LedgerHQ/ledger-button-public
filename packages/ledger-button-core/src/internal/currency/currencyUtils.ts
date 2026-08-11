import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";

/** Neutral decimals fallback when no provider claims the currency. */
export const DEFAULT_NATIVE_DECIMALS_FALLBACK = 18;

export type NativeDecimalsResolver = (
  currencyId: string,
) => number | undefined;

type CurrencyUnit = {
  name: string;
  code: string;
  magnitude: number;
};

export type FormatBalanceOptions = {
  showCode?: boolean;
  disableRounding?: boolean;
  showAllDigits?: boolean;
};

/**
 * Resolves native decimals for a currency. Prefer a provider-backed resolver
 * when available; otherwise use {@link DEFAULT_NATIVE_DECIMALS_FALLBACK}.
 */
export function getDefaultDecimals(
  currencyId: string,
  resolveNativeDecimals?: NativeDecimalsResolver,
): number {
  return resolveNativeDecimals?.(currencyId) ?? DEFAULT_NATIVE_DECIMALS_FALLBACK;
}

/**
 * Formats a raw balance value using Ledger's standard currency formatting.
 *
 * @param rawBalance - The raw balance value (in smallest unit, e.g., wei for ETH)
 * @param decimals - The number of decimals for the currency. When `undefined`, falls back via `resolveNativeDecimals` or the neutral default.
 * @param ticker - The currency ticker symbol (e.g., "ETH", "DAI")
 * @param currencyId - The Ledger currency identifier (e.g., "ethereum", "solana"), used for the decimals fallback
 * @param options - Formatting options
 * @param resolveNativeDecimals - Provider-backed decimals resolver (via BlockchainProviderManager)
 * @returns The formatted balance string
 *
 * @example
 * formatBalance(BigInt("1000000000000000000"), 18, "ETH", "ethereum") // "1"
 *
 * @example
 * formatBalance(BigInt("93229707264"), 18, "DAI", "ethereum", { disableRounding: true })
 * // "0.000000093229707264"
 */
export function formatBalance(
  rawBalance: bigint | string,
  decimals: number | undefined,
  ticker: string,
  currencyId: string,
  options: FormatBalanceOptions = {},
  resolveNativeDecimals?: NativeDecimalsResolver,
): string {
  if (decimals === undefined) {
    decimals = getDefaultDecimals(currencyId, resolveNativeDecimals);
  }

  const unit: CurrencyUnit = {
    name: ticker,
    code: ticker,
    magnitude: decimals,
  };

  const value = new BigNumber(rawBalance.toString());
  return formatCurrencyUnit(unit, value, options).replace(/\u00A0/g, " ");
}
