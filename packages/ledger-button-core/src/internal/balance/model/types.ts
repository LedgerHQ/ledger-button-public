export type AccountBalance = {
  nativeBalance: NativeBalance;
  tokenBalances: TokenBalance[];
};

export type NativeBalance = {
  readonly balance: bigint;
};

export class TokenBalance {
  readonly decimals: number;
  readonly balance: bigint;
  readonly name: string;
  readonly ticker: string;

  constructor(decimals: number, balance: bigint, name: string, ticker: string) {
    this.decimals = decimals;
    this.balance = balance;
    this.name = name;
    this.ticker = ticker;
  }

  get balanceFormatted(): string {
    const divisor = BigInt(10 ** this.decimals);
    const wholePart = this.balance / divisor;
    const fractionalPart = this.balance % divisor;

    if (fractionalPart === BigInt(0)) {
      return wholePart.toString();
    }

    const fractionalStr = fractionalPart
      .toString()
      .padStart(this.decimals, "0");
    const trimmedFractional = fractionalStr.replace(/0+$/, "");

    if (trimmedFractional === "") {
      return wholePart.toString();
    }

    return `${wholePart}.${trimmedFractional}`;
  }
}
