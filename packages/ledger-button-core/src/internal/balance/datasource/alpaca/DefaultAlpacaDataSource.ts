import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { configModuleTypes } from "../../../config/configModuleTypes.js";
import { Config } from "../../../config/model/config.js";
import type { NetworkServiceOpts } from "../../../network/DefaultNetworkService.js";
import { networkModuleTypes } from "../../../network/networkModuleTypes.js";
import type { NetworkService } from "../../../network/NetworkService.js";
import type { AlpacaDataSource } from "./AlpacaDataSource.js";
import {
  AlpacaBalance,
  AlpacaBalanceDto,
  AlpacaBalanceResponse,
} from "./alpacaTypes.js";

@injectable()
export class DefaultAlpacaDataSource implements AlpacaDataSource {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {}

  async getBalanceForAddressAndCurrencyId(
    address: string,
    currencyId: string,
  ): Promise<Either<Error, AlpacaBalance[]>> {
    //Add check if blockchain is supported by Alpaca
    const requestUrl = `${this.config.getAlpacaUrl(this.config.environment)}/${currencyId}/account/${address}/balance`;
    const balanceResult: Either<Error, AlpacaBalanceDto[]> =
      await this.networkService.get(requestUrl);

    if (balanceResult.isRight()) {
      const balanceDtos = balanceResult.extract();

      if (!Array.isArray(balanceDtos)) {
        return Left(new Error("Failed to fetch balance from Alpaca"));
      }

      const balances = balanceDtos.map((balance: AlpacaBalanceDto) => {
        return {
          value: balance.value,
          type: balance.asset.type,
          reference: balance.asset.assetReference,
        };
      });
      return Right(balances);
    } else {
      return Left(new Error("Failed to fetch balance from Alpaca"));
    }
  }
}
