import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { CoinServiceServiceErrors } from "@internal/balance/model/error";
import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { Config } from "@internal/config/model/config";
import { networkModuleTypes } from "@internal/network/di/networkModuleTypes";
import type { NetworkServiceOpts } from "@internal/network/model/types";
import type { NetworkService } from "@internal/network/NetworkService";

import type { CoinServiceDataSource } from "./CoinServiceDataSource";
import {
  CoinServiceBalance,
  CoinServiceBalanceDto,
  CoinServiceFeeEstimationRequest,
  CoinServiceFeeEstimationResponse,
  CoinServiceTransactionIntent,
} from "./coinServiceTypes";

@injectable()
export class DefaultCoinServiceDataSource implements CoinServiceDataSource {
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {}

  async getBalanceForAddressAndCurrencyId(
    address: string,
    currencyId: string,
  ): Promise<Either<Error, CoinServiceBalance[]>> {
    // Add check if blockchain is supported by CoinService
    const requestUrl = `${this.config.getCoinServiceUrl()}/v1/${currencyId}/account/${address}/balance`;
    const balanceResult: Either<Error, CoinServiceBalanceDto[]> =
      await this.networkService.get(requestUrl);

    if (!balanceResult.isRight())
      return Left(new Error("Failed to fetch balance from CoinService"));

    const balanceDtos = balanceResult.extract();

    if (!Array.isArray(balanceDtos))
      return Left(new Error("Failed to fetch balance from CoinService"));

    const balances = balanceDtos.map((balance) => ({
      value: balance.value,
      type: balance.asset.type,
      reference: balance.asset.assetReference,
    }));

    return Right(balances);
  }

  async estimateTransactionFee(
    network: string,
    intent: CoinServiceTransactionIntent,
  ): Promise<Either<Error, CoinServiceFeeEstimationResponse>> {
    const requestUrl = `${this.config.getCoinServiceUrl()}/v1/${network}/transaction/estimate`;
    const requestBody: CoinServiceFeeEstimationRequest = { intent };

    const feeEstimationResult: Either<Error, CoinServiceFeeEstimationResponse> =
      await this.networkService.post(requestUrl, JSON.stringify(requestBody));

    return feeEstimationResult.mapLeft((error) =>
      CoinServiceServiceErrors.feeEstimationError(network, error),
    );
  }
}
