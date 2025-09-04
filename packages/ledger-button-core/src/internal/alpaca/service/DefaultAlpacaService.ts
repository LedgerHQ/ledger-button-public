import { type Factory, inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { alpacaModuleTypes } from "../alpacaModuleTypes.js";
import { type EvmDataSource } from "../datasource/EvmDataSource.js";
import { type AlpacaServiceError,AlpacaServiceErrors } from "../model/error.js";
import {
  AlpacaBalanceRequest,
  AlpacaBalanceResponse,
  NativeBalance,
  SUPPORTED_EVM_CHAINS,
  TokenBalance,
} from "../model/types.js";
import { type AlpacaService } from "./AlpacaService.js";

@injectable()
export class DefaultAlpacaService implements AlpacaService {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(alpacaModuleTypes.EvmDataSource)
    private readonly evmDataSource: EvmDataSource,
  ) {
    this.logger = this.loggerFactory("[Alpaca Service]");
  }

  async getBalance(
    request: AlpacaBalanceRequest,
  ): Promise<Either<AlpacaServiceError, AlpacaBalanceResponse>> {
    this.logger.debug("Getting balance for address", {
      address: request.address,
      currencyId: request.currencyId,
    });

    if (!this.isValidAddress(request.address)) {
      const error = AlpacaServiceErrors.invalidAddress(request.address);
      this.logger.error("Invalid address format", { error });
      return Left(error);
    }

    if (!this.isSupportedChain(request.currencyId)) {
      const error = AlpacaServiceErrors.unsupportedChain(request.currencyId);
      this.logger.error("Unsupported chain", { error });
      return Left(error);
    }

    const chainConfig = SUPPORTED_EVM_CHAINS[request.currencyId];

    try {
      const [nativeBalanceResult, tokenBalancesResult] = await Promise.all([
        this.evmDataSource.getNativeBalance(request.address, chainConfig),
        this.evmDataSource.getTokenBalances(request.address, chainConfig),
      ]);

      if (nativeBalanceResult.isLeft()) {
        const error = AlpacaServiceErrors.balanceFetchError(
          request.address,
          request.currencyId,
          nativeBalanceResult.extract(),
        );
        this.logger.error("Failed to fetch native balance", { error });
        return Left(error);
      }

      const nativeBalance = nativeBalanceResult.extract() as NativeBalance;
      this.logger.debug("Fetched native balance", { nativeBalance });

      if (tokenBalancesResult.isLeft()) {
        this.logger.warn(
          "Failed to fetch token balances, returning native balance only",
          {
            error: tokenBalancesResult.extract(),
          },
        );

        const response: AlpacaBalanceResponse = {
          address: request.address,
          chainId: chainConfig.chainId,
          nativeBalance,
          tokenBalances: [],
          lastUpdated: Date.now(),
        };

        return Right(response);
      }

      const tokenBalances = tokenBalancesResult.extract() as TokenBalance[];
      this.logger.debug("Fetched token balances", {
        tokenCount: tokenBalances.length,
        tokenBalances,
      });

      const response: AlpacaBalanceResponse = {
        address: request.address,
        chainId: chainConfig.chainId,
        nativeBalance,
        tokenBalances,
        lastUpdated: Date.now(),
      };

      this.logger.debug("Successfully retrieved balance information", {
        response,
      });

      return Right(response);
    } catch (error) {
      const serviceError = AlpacaServiceErrors.unknownError(
        `Unexpected error while fetching balance for ${request.address} on ${request.currencyId}`,
        error,
      );
      this.logger.error("Unexpected error in getBalance", {
        error: serviceError,
      });
      return Left(serviceError);
    }
  }

  private isSupportedChain(currencyId: string): boolean {
    return currencyId in SUPPORTED_EVM_CHAINS;
  }

  private isValidAddress(address: string): boolean {
    if (!address || typeof address !== "string") {
      return false;
    }

    // Based on https://goethereumbook.org/en/address-check/
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  }
}
