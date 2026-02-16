import { Either } from "purify-ts";

import { type CurrencyInformation, type TokenInformation } from "./calTypes.js";

export interface CalDataSource {
  getTokenInformation(
    tokenAddress: string,
    currencyId: string,
  ): Promise<Either<Error, TokenInformation>>;

  getCurrencyInformation(
    currencyId: string,
  ): Promise<Either<Error, CurrencyInformation>>;
}
