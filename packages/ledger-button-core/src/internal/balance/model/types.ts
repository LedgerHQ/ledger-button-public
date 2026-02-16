import { formatBalance } from "../../currency/formatCurrency.js";

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

  constructor(
    ledgerId: string,
    decimals: number,
    balance: bigint,
    name: string,
    ticker: string,
  ) {
    this.ledgerId = ledgerId;
    this.decimals = decimals;
    this.balance = balance;
    this.name = name;
    this.ticker = ticker;
  }

  get balanceFormatted(): string {
    return formatBalance(this.balance, this.decimals, this.ticker);
  }
}
