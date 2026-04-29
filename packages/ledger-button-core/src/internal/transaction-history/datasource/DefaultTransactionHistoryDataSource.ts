import { inject, injectable } from "inversify";
import { Either } from "purify-ts";

import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import type { NetworkServiceOpts } from "../../network/model/types.js";
import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import type { NetworkService } from "../../network/NetworkService.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import {
  AlpacaOperationsResponse,
  TransactionHistoryOptions,
} from "../model/transactionHistoryTypes.js";
import type { TransactionHistoryDataSource } from "./TransactionHistoryDataSource.js";

const DEFAULT_BATCH_SIZE = 20;

@injectable()
export class DefaultTransactionHistoryDataSource
  implements TransactionHistoryDataSource
{
  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {}

  async getTransactions(
    network: string,
    address: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, AlpacaOperationsResponse>> {
    const queryParams = this.buildQueryParams(options);
    const requestUrl = this.buildRequestUrl(network, address, queryParams);

    const result =
      await this.networkService.get<AlpacaOperationsResponse>(requestUrl);

    return result.mapLeft(
      (error) =>
        new TransactionHistoryError(
          `Failed to fetch transaction history for ${address}`,
          { address, network, originalError: error.message },
        ),
    );
  }

  private buildQueryParams(options?: TransactionHistoryOptions): string {
    const params = new URLSearchParams();

    params.set("limit", String(options?.batchSize ?? DEFAULT_BATCH_SIZE));

    if (options?.pageToken) {
      params.set("cursor", options.pageToken);
    }

    return params.toString();
  }

  private buildRequestUrl(
    network: string,
    address: string,
    queryParams: string,
  ): string {
    const baseUrl = this.config.getAlpacaUrl();
    return `${baseUrl}/v1/${network}/account/${address}/operations?${queryParams}`;
  }
}
