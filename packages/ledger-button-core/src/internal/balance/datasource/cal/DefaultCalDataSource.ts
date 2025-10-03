import { inject, injectable } from "inversify";
import { type Either, Left, Right } from "purify-ts";

import { getChainIdFromCurrencyId } from "../../../blockchain/evm/chainUtils.js";
import { configModuleTypes } from "../../../config/configModuleTypes.js";
import { Config } from "../../../config/model/config.js";
import { type NetworkServiceOpts } from "../../../network/DefaultNetworkService.js";
import { networkModuleTypes } from "../../../network/networkModuleTypes.js";
import type { NetworkService } from "../../../network/NetworkService.js";
import { type CalDataSource } from "./CalDataSource.js";
import { type CalTokenResponse, TokenInformation } from "./calTypes.js";

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
    //Add check if blockchain is supported by Alpaca
    const chainId = getChainIdFromCurrencyId(currencyId);
    const requestUrl = `${this.config.getCalUrl(this.config.environment)}/v1/tokens?contract_address=${tokenAddress}&chain_id=${chainId}&output=name,decimals,ticker`;
    const getTokenInformationResult: Either<Error, CalTokenResponse> =
      await this.networkService.get(requestUrl);

    if (getTokenInformationResult.isRight()) {
      if (getTokenInformationResult.extract().length > 0) {
        return Right(getTokenInformationResult.extract()[0]);
      } else {
        return Left(new Error("No token information found in Cal"));
      }
    } else {
      return Left(new Error("Failed to fetch token information from Cal"));
    }
  }
}
