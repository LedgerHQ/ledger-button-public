import { formatBalance } from "@internal/currency/utils/currencyUtils";

export type AccountBalance = {
  nativeBalance: NativeBalance;
  tokenBalances: TokenBalance[];
};

export type NativeBalance = {
  readonly balance: bigint;
};

export type TransactionInfo = {
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: string;
};

export type GasFeeEstimation = {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

export class TokenBalance {
  readonly ledgerId: string;
  readonly decimals: number;
  readonly balance: bigint;
  readonly name: string;
  readonly ticker: string;
  readonly categories: string[];

  constructor(
    ledgerId: string,
    decimals: number,
    balance: bigint,
    name: string,
    ticker: string,
    categories: string[],
  ) {
    this.ledgerId = ledgerId;
    this.decimals = decimals;
    this.balance = balance;
    this.name = name;
    this.ticker = ticker;
    this.categories = categories;
  }

  get balanceFormatted(): string {
    return formatBalance(this.balance, this.decimals, this.ticker);
  }
}
