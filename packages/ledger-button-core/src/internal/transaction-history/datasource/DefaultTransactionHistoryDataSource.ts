import { type Factory, inject, injectable } from "inversify";
import { Either } from "purify-ts";

import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { NetworkServiceOpts } from "../../network/model/types.js";
import { networkModuleTypes } from "../../network/networkModuleTypes.js";
import type { NetworkService } from "../../network/NetworkService.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import {
  AlpacaOperationsResponse,
  TransactionHistoryOptions,
} from "../model/transactionHistoryTypes.js";
import type { TransactionHistoryDataSource } from "./TransactionHistoryDataSource.js";

@injectable()
export class DefaultTransactionHistoryDataSource
  implements TransactionHistoryDataSource
{
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(networkModuleTypes.NetworkService)
    private readonly networkService: NetworkService<NetworkServiceOpts>,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("DefaultTransactionHistoryDataSource");
  }

  async getTransactions(
    network: string,
    address: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, AlpacaOperationsResponse>> {
    const queryParams = this.buildQueryParams(options);
    const requestUrl = this.buildRequestUrl(network, address, queryParams);

    const result =
      await this.networkService.get<AlpacaOperationsResponse>(requestUrl);

    return result
      .mapLeft(
        (error) =>
          new TransactionHistoryError(
            `Failed to fetch transaction history for ${address}`,
            { address, network, originalError: error.message },
          ),
      )
      .map((response) => this.dropOperationsWithoutHash(response));
  }

  private buildQueryParams(options?: TransactionHistoryOptions): string {
    const params = new URLSearchParams();

    // Newest first by default to match the existing UX.
    params.set("order", "desc");

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

  /**
   * The Alpaca API occasionally returns operations with a missing/empty
   * `tx.hash`. Drop them at the boundary so consumers can rely on every
   * surfaced operation having a usable hash.
   */
  private dropOperationsWithoutHash(
    response: AlpacaOperationsResponse,
  ): AlpacaOperationsResponse {
    const items = response.items ?? [];
    const kept = items.filter(
      (op) => typeof op.tx?.hash === "string" && op.tx.hash.length > 0,
    );

    if (kept.length !== items.length) {
      this.logger.warn("Dropped Alpaca operations without a tx hash", {
        received: items.length,
        kept: kept.length,
      });
    }

    return { ...response, items: kept };
  }
}
