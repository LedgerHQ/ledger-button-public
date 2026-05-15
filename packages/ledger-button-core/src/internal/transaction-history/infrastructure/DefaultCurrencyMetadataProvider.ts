import { inject, injectable } from "inversify";
import { Either, Right } from "purify-ts";

import { balanceModuleTypes } from "../../balance/balanceModuleTypes.js";
import type { CalDataSource } from "../../balance/datasource/cal/CalDataSource.js";
import type {
  CurrencyInformation,
  TokenInformation,
} from "../../balance/datasource/cal/calTypes.js";
import type { CurrencyMetadataProvider } from "../application/port/CurrencyMetadataProvider.js";

/**
 * Caches token-information lookups keyed by `${currencyId}:${contractAddress}`.
 * Currency-information requests are not cached because callers typically issue
 * one per page-fetch and the data may change between sessions.
 */
@injectable()
export class DefaultCurrencyMetadataProvider
  implements CurrencyMetadataProvider
{
  private readonly tokenInfoCache = new Map<string, TokenInformation>();

  constructor(
    @inject(balanceModuleTypes.CalDataSource)
    private readonly calDataSource: CalDataSource,
  ) {}

  async getCurrencyInformation(
    currencyId: string,
  ): Promise<Either<Error, CurrencyInformation>> {
    return this.calDataSource.getCurrencyInformation(currencyId);
  }

  async getTokenInformation(
    contractAddress: string,
    currencyId: string,
  ): Promise<Either<Error, TokenInformation>> {
    const cacheKey = this.buildCacheKey(contractAddress, currencyId);
    const cached = this.tokenInfoCache.get(cacheKey);
    if (cached) {
      return Right(cached);
    }

    const result = await this.calDataSource.getTokenInformation(
      contractAddress,
      currencyId,
    );

    return result.ifRight((info) => {
      this.tokenInfoCache.set(cacheKey, info);
    });
  }

  private buildCacheKey(contractAddress: string, currencyId: string): string {
    return `${currencyId}:${contractAddress.toLowerCase()}`;
  }
}
