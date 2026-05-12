import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";

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
 * @param rawBalance - The raw balance value (in smallest unit, e.g., wei for ETH)
 * @param decimals - The number of decimals for the currency (e.g., 18 for ETH)
 * @param ticker - The currency ticker symbol (e.g., "ETH", "DAI")
 * @param options - Formatting options
 * @returns The formatted balance string
 *
 * @example
 * // Format ETH balance (18 decimals)
 * formatBalance(BigInt("1000000000000000000"), 18, "ETH") // "1 ETH" or "1"
 *
 * @example
 * // Format with full precision
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
  return formatCurrencyUnit(unit, value, options);
}
