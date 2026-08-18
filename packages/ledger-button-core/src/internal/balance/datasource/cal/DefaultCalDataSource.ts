import { inject, injectable } from "inversify";
import { type Either, Left, Right } from "purify-ts";

import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { Config } from "@internal/config/model/config";
import { networkModuleTypes } from "@internal/network/di/networkModuleTypes";
import { type NetworkServiceOpts } from "@internal/network/model/types";
import type { NetworkService } from "@internal/network/NetworkService";

import { type CalDataSource } from "./CalDataSource";
import {
  type CalCoinResponse,
  type CalNetworkExternalLinks,
  type CalTokenResponse,
  type CurrencyInformation,
  type TokenInformation,
} from "./calTypes";

@injectable()
export class DefaultCalDataSource implements CalDataSource {
  /**
   * Currency metadata is immutable for the lifetime of a session and is read on
   * several hot paths (account hydration, pending-tx tracking, explorer links),
   * so in-flight requests are shared rather than duplicated.
   */
  private readonly currencyInformationCache = new Map<
    string,
    Promise<Either<Error, CurrencyInformation>>
  >();

  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly blockchainProviderManager: BlockchainProviderManager,
  ) {}

  async getTokenInformation(
    tokenAddress: string,
    currencyId: string,
  ): Promise<Either<Error, TokenInformation>> {
    const chainId = this.blockchainProviderManager
      .describeCurrency(currencyId)
      .map((currency) => currency.networkId)
      .orDefault("1");

    const requestUrl = `${this.config.getCalUrl()}/v1/tokens?contract_address=${tokenAddress}&chain_id=${chainId}&output=id,name,decimals,ticker,network_external_links`;
    const getTokenInformationResult: Either<Error, CalTokenResponse> =
      await this.networkService.get(requestUrl);

    if (getTokenInformationResult.isLeft()) {
      return Left(new Error("Failed to fetch token information from Cal"));
    }

    const tokenInformation = getTokenInformationResult.extract();
    if (!Array.isArray(tokenInformation) || tokenInformation.length === 0) {
      return Left(new Error("No token information found in Cal"));
    }

    const token = tokenInformation[0];

    return Right({
      id: token.id,
      decimals: token.decimals,
      ticker: token.ticker,
      name: token.name,
      transactionExplorerUrlTemplate: extractTransactionExplorerUrlTemplate(
        token.network_external_links,
      ),
    });
  }

  getCurrencyInformation(
    currencyId: string,
  ): Promise<Either<Error, CurrencyInformation>> {
    const cached = this.currencyInformationCache.get(currencyId);
    if (cached) {
      return cached;
    }

    const request = this.fetchCurrencyInformation(currencyId);
    this.currencyInformationCache.set(currencyId, request);
    void request.then((result) => {
      if (result.isLeft()) {
        this.currencyInformationCache.delete(currencyId);
      }
    });
    return request;
  }

  private async fetchCurrencyInformation(
    currencyId: string,
  ): Promise<Either<Error, CurrencyInformation>> {
    const requestUrl = `${this.config.getCalUrl()}/v1/coins?id=${currencyId}&output=id,name,ticker,units,network_external_links`;
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

    if (!coin.units || coin.units.length === 0) {
      return Left(new Error(`No units found for currency ${coin.id} in Cal`));
    }

    const decimals = Math.max(...coin.units.map((u) => u.magnitude));

    return Right({
      id: coin.id,
      name: coin.name,
      ticker: coin.ticker,
      decimals,
      transactionExplorerUrlTemplate: extractTransactionExplorerUrlTemplate(
        coin.network_external_links,
      ),
    });
  }
}

function extractTransactionExplorerUrlTemplate(
  links: CalNetworkExternalLinks | undefined,
): string | undefined {
  return links?.explorers?.[0]?.transaction;
}
