import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { TransactionHistoryDataSource } from "../datasource/TransactionHistoryDataSource.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import {
  ExplorerResponse,
  ExplorerTransaction,
  TransactionHistoryItem,
  TransactionHistoryOptions,
  TransactionHistoryResult,
  TransactionType,
} from "../model/transactionHistoryTypes.js";
import { transactionHistoryModuleTypes } from "../transactionHistoryModuleTypes.js";

@injectable()
export class FetchTransactionHistoryUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(transactionHistoryModuleTypes.TransactionHistoryDataSource)
    private readonly dataSource: TransactionHistoryDataSource,
  ) {
    this.logger = loggerFactory("FetchTransactionHistoryUseCase");
  }

  async execute(
    blockchain: string,
    address: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, TransactionHistoryResult>> {
    this.logger.debug("Fetching transaction history", {
      blockchain,
      address,
      options,
    });

    const result = await this.dataSource.getTransactions(
      blockchain,
      address,
      options,
    );

    return result.caseOf({
      Left: (error) => {
        this.logger.error("Failed to fetch transaction history", { error });
        return Left(error);
      },
      Right: (explorerResponse) => {
        const transformedResult = this.transformResponse(
          explorerResponse,
          address.toLowerCase(),
        );

        this.logger.debug("Transaction history fetched successfully", {
          transactionCount: transformedResult.transactions.length,
          hasNextPage: !!transformedResult.nextPageToken,
        });

        return Right(transformedResult);
      },
    });
  }

  private transformResponse(
    response: ExplorerResponse,
    normalizedAddress: string,
  ): TransactionHistoryResult {
    const transactions = response.txs.map((tx) =>
      this.transformTransaction(tx, normalizedAddress),
    );

    return {
      transactions,
      nextPageToken: response.truncated ? response.token : undefined,
    };
  }

  private transformTransaction(
    tx: ExplorerTransaction,
    normalizedAddress: string,
  ): TransactionHistoryItem {
    const type = this.determineTransactionType(tx, normalizedAddress);
    const value = this.calculateTransactionValue(tx, normalizedAddress, type);
    const timestamp = this.extractTimestamp(tx);

    return {
      hash: tx.hash,
      type,
      value,
      timestamp,
    };
  }

  private determineTransactionType(
    tx: ExplorerTransaction,
    normalizedAddress: string,
  ): TransactionType {
    const isSender = tx.inputs.some(
      (input) => input.address?.toLowerCase() === normalizedAddress,
    );

    return isSender ? "sent" : "received";
  }

  private calculateTransactionValue(
    tx: ExplorerTransaction,
    normalizedAddress: string,
    type: TransactionType,
  ): string {
    if (type === "sent") {
      return this.calculateSentValue(tx, normalizedAddress);
    }
    return this.calculateReceivedValue(tx, normalizedAddress);
  }

  private calculateSentValue(
    tx: ExplorerTransaction,
    normalizedAddress: string,
  ): string {
    const totalOutputValue = tx.outputs
      .filter((output) => output.address?.toLowerCase() !== normalizedAddress)
      .reduce((sum, output) => sum + BigInt(output.value), BigInt(0));

    return totalOutputValue.toString();
  }

  private calculateReceivedValue(
    tx: ExplorerTransaction,
    normalizedAddress: string,
  ): string {
    const receivedValue = tx.outputs
      .filter((output) => output.address?.toLowerCase() === normalizedAddress)
      .reduce((sum, output) => sum + BigInt(output.value), BigInt(0));

    return receivedValue.toString();
  }

  private extractTimestamp(tx: ExplorerTransaction): string {
    return tx.block?.time ?? tx.received_at;
  }
}
