export type CalTokenResponse = CalTokenDto[];

export type CalTokenDto = {
  id: string;
  decimals: number;
  ticker: string;
  name: string;
};

export type TokenInformation = {
  id: string;
  decimals: number;
  ticker: string;
  name: string;
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
};

export type CurrencyInformation = {
  id: string;
  name: string;
  ticker: string;
  decimals: number;
};
