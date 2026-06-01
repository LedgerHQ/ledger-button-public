import type { Either } from "purify-ts";

import type { FiatCurrency } from "./fiatCurrencyTypes.js";

export interface FiatCurrencyDataSource {
  getSupportedFiatCurrencies(): Promise<Either<Error, FiatCurrency[]>>;
}
