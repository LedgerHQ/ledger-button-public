import type { Either } from "purify-ts";

import type { FiatCurrency } from "./fiatCurrencyTypes";

export interface FiatCurrencyDataSource {
  getSupportedFiatCurrencies(): Promise<Either<Error, FiatCurrency[]>>;
}
