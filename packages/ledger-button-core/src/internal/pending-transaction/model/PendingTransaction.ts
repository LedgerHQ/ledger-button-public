export type PendingTransaction = {
  hash: string;
  chainId: number;
  address: string;
  timestamp: string;
  type: "sent";
  value: string;
  formattedValue: string;
  ticker: string;
  currencyName: string;
  ledgerId: string;
  fiatValue?: string;
  fiatCurrency?: string;
  explorerUrl?: string;
};
