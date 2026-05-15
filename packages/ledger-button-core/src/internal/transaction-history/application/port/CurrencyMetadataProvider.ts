import { Either } from "purify-ts";

import type {
  CurrencyInformation,
  TokenInformation,
} from "../../../balance/datasource/cal/calTypes.js";

/**
 * Domain-named port that the transaction-history use cases depend on for
 * currency and token metadata. Implementations are free to add caching,
 * fallbacks, or alternative back-ends without the use case knowing.
 */
export interface CurrencyMetadataProvider {
  getCurrencyInformation(
    currencyId: string,
  ): Promise<Either<Error, CurrencyInformation>>;

  getTokenInformation(
    contractAddress: string,
    currencyId: string,
  ): Promise<Either<Error, TokenInformation>>;
}
