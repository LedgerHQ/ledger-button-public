export type CalTokenResponse = CalTokenDto[];

export type CalTokenDto = {
  decimals: number;
  ticker: string;
  name: string;
};

export type TokenInformation = {
  decimals: number;
  ticker: string;
  name: string;
};

export type CalServiceError = {
  message: string;
};
