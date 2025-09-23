export interface AlpacaBalanceRequest {
  address: string;
  currencyId: string;
}

export type AlpacaBalanceDto = {
  value: string;
  asset: AssetDto;
};
export type AlpacaBalanceResponse = AlpacaBalanceDto[];

export type AssetDto = {
  type: "native" | "erc20" | "erc721" | "erc1155";
  assetReference?: string;
};

export type AlpacaBalance = {
  value: string;
  type: "native" | "erc20" | "erc721" | "erc1155";
  reference?: string;
};
