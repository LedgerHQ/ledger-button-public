export type PendingTransaction = {
  hash: string;
  chainId: number;
  address: string;
  timestamp: string;
  type: "sent";
  /** Unset when the amount cannot be read from the signed payload. */
  value?: string;
  formattedValue?: string;
  ticker: string;
  currencyName: string;
  ledgerId: string;
  fiatValue?: string;
  fiatCurrency?: string;
  explorerUrl?: string;
};
