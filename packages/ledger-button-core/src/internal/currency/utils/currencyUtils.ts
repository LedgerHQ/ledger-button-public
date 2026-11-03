import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";

/**
 * Magnitude used when no source could resolve a currency's decimals. Renders
 * the raw on-chain value unscaled, which is preferable to scaling by a guessed
 * magnitude and reporting a wrong amount.
 */
export const UNRESOLVED_DECIMALS = 0;

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
 * Formats a raw balance value using Ledger's standard currency formatting.
 *
 * Callers resolve `decimals` beforehand (CAL metadata, then the provider that
 * owns the currency) so this stays free of any blockchain knowledge.
 *
 * @param rawBalance - The raw balance value (in smallest unit, e.g., wei for ETH)
 * @param decimals - The number of decimals for the currency
 * @param ticker - The currency ticker symbol (e.g., "ETH", "DAI")
 * @param options - Formatting options
 * @returns The formatted balance string
 *
 * @example
 * formatBalance(BigInt("1000000000000000000"), 18, "ETH") // "1"
 *
 * @example
 * formatBalance(BigInt("93229707264"), 18, "DAI", { disableRounding: true })
 * // "0.000000093229707264"
 */
export function formatBalance(
  rawBalance: bigint | string,
  decimals: number,
  ticker: string,
  options: FormatBalanceOptions = {},
): string {
  const unit: CurrencyUnit = {
    name: ticker,
    code: ticker,
    magnitude: decimals,
  };

  const value = new BigNumber(rawBalance.toString());
  return formatCurrencyUnit(unit, value, options).replace(/\u00A0/g, " ");
}
