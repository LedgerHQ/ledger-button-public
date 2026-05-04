export interface CoinServiceBalanceRequest {
  address: string;
  currencyId: string;
}

export type CoinServiceBalanceDto = {
  value: string;
  asset: AssetDto;
};
export type CoinServiceBalanceResponse = CoinServiceBalanceDto[];

export type AssetDto = {
  type: "native" | "erc20" | "erc721" | "erc1155";
  assetReference?: string;
};

export type CoinServiceBalance = {
  value: string;
  type: "native" | "erc20" | "erc721" | "erc1155";
  reference?: string;
};

export type CoinServiceTransactionIntent = {
  type: string;
  sender: string;
  recipient?: string;
  amount?: string;
  asset?: {
    type: string;
    assetReference?: string;
  };
  feesStrategy?: "slow" | "medium" | "fast";
  data?: string;
};

export type CoinServiceFeeEstimationRequest = {
  intent: CoinServiceTransactionIntent;
};

export type CoinServiceEvmFeeEstimationParameters = {
  gasPrice?: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  nextBaseFee: string;
  gasLimit: string;
  gasOptions: Record<string, unknown>;
};

export type CoinServiceFeeEstimationResponse = {
  value: string;
  parameters: CoinServiceEvmFeeEstimationParameters;
};
