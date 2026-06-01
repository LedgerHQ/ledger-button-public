export type CalExplorerLink = {
  transaction?: string;
};

export type CalNetworkExternalLinks = {
  explorers?: CalExplorerLink[];
};

export type CalTokenResponse = CalTokenDto[];

export type CalTokenDto = {
  id: string;
  decimals: number;
  ticker: string;
  name: string;
  network_external_links?: CalNetworkExternalLinks;
};

export type TokenInformation = {
  id: string;
  decimals: number;
  ticker: string;
  name: string;
  transactionExplorerUrlTemplate?: string;
};

export type CalServiceError = {
  message: string;
};

export type CalCoinResponse = CalCoinDto[];

export type CalUnit = {
  name: string;
  code: string;
  magnitude: number;
};

export type CalCoinDto = {
  id: string;
  name: string;
  ticker: string;
  units: CalUnit[];
  network_external_links?: CalNetworkExternalLinks;
};

export type CurrencyInformation = {
  id: string;
  name: string;
  ticker: string;
  decimals: number;
  transactionExplorerUrlTemplate?: string;
};
