import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";

import { EVM_NATIVE_DECIMALS } from "../evm-provider/ledger-eip1193/utils/chainUtils.js";
import {
  isSupportedSolanaCurrency,
  SOLANA_NATIVE_DECIMALS,
} from "../solana-provider/ledger-solana-wallet/utils/clusterUtils.js";

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

export function getDefaultDecimals(currencyId: string): number {
  if (isSupportedSolanaCurrency(currencyId)) {
    return SOLANA_NATIVE_DECIMALS;
  }
  return EVM_NATIVE_DECIMALS;
}

/**
 * Formats a raw balance value using Ledger's standard currency formatting.
 *
 * @param rawBalance - The raw balance value (in smallest unit, e.g., wei for ETH)
 * @param decimals - The number of decimals for the currency. When `undefined`, falls back to chain defaults via `currencyId`.
 * @param ticker - The currency ticker symbol (e.g., "ETH", "DAI")
 * @param currencyId - The Ledger currency identifier (e.g., "ethereum", "solana"), used for the decimals fallback
 * @param options - Formatting options
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
): string {
  if (decimals === undefined) {
    decimals = getDefaultDecimals(currencyId);
  }

  const unit: CurrencyUnit = {
    name: ticker,
    code: ticker,
    magnitude: decimals,
  };

  const value = new BigNumber(rawBalance.toString());
  return formatCurrencyUnit(unit, value, options).replace(/\u00A0/g, " ");
}
