import { inject, injectable } from "inversify";
import { type Either, Left, Right } from "purify-ts";

import { getChainIdFromCurrencyId } from "../../../blockchain/evm/chainUtils.js";
import { configModuleTypes } from "../../../config/configModuleTypes.js";
import { Config } from "../../../config/model/config.js";
import { type NetworkServiceOpts } from "../../../network/model/types.js";
import { networkModuleTypes } from "../../../network/networkModuleTypes.js";
import type { NetworkService } from "../../../network/NetworkService.js";
import { type CalDataSource } from "./CalDataSource.js";
import {
  type CalCoinResponse,
  type CalTokenResponse,
  type CurrencyInformation,
  type TokenInformation,
} from "./calTypes.js";

@injectable()
export class DefaultCalDataSource implements CalDataSource {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {}

  async getTokenInformation(
    tokenAddress: string,
    currencyId: string,
  ): Promise<Either<Error, TokenInformation>> {
    const chainId = getChainIdFromCurrencyId(currencyId);

    const requestUrl = `${this.config.getCalUrl()}/v1/tokens?contract_address=${tokenAddress}&chain_id=${chainId}&output=id,name,decimals,ticker`;
    const getTokenInformationResult: Either<Error, CalTokenResponse> =
      await this.networkService.get(requestUrl);

    if (getTokenInformationResult.isLeft()) {
      return Left(new Error("Failed to fetch token information from Cal"));
    }

    const tokenInformation = getTokenInformationResult.extract();
    if (!Array.isArray(tokenInformation) || tokenInformation.length === 0) {
      return Left(new Error("No token information found in Cal"));
    }

    return Right(tokenInformation[0]);
  }

  async getCurrencyInformation(
    currencyId: string,
  ): Promise<Either<Error, CurrencyInformation>> {
    const requestUrl = `${this.config.getCalUrl()}/v1/coins?id=${currencyId}&output=id,name,ticker,units`;
    const getCurrencyInformationResult: Either<Error, CalCoinResponse> =
      await this.networkService.get(requestUrl);

    if (getCurrencyInformationResult.isLeft()) {
      return Left(new Error("Failed to fetch currency information from Cal"));
    }

    const currencyData = getCurrencyInformationResult.extract();
    if (!Array.isArray(currencyData) || currencyData.length === 0) {
      return Left(new Error("No currency information found in Cal"));
    }

    const coin = currencyData[0];

    const decimals =
      coin.units && coin.units.length > 0
        ? Math.max(...coin.units.map((u) => u.magnitude))
        : 18;

    return Right({
      id: coin.id,
      name: coin.name,
      ticker: coin.ticker,
      decimals,
    });
  }
}
