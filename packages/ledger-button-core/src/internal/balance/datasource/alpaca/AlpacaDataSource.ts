import { Either } from "purify-ts";

import { AlpacaBalance } from "./alpacaTypes.js";

export interface AlpacaDataSource {
  getBalanceForAddressAndCurrencyId(
    address: string,
    currencyId: string,
  ): Promise<Either<Error, AlpacaBalance[]>>;
}
