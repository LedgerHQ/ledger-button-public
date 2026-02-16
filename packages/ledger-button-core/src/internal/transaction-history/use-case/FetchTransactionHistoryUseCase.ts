import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { balanceModuleTypes } from "../../balance/balanceModuleTypes.js";
import type { CalDataSource } from "../../balance/datasource/cal/CalDataSource.js";
import type { TokenInformation } from "../../balance/datasource/cal/calTypes.js";
import { formatBalance } from "../../currency/formatCurrency.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { TransactionHistoryDataSource } from "../datasource/TransactionHistoryDataSource.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import {
  EvmTransferEvent,
  ExplorerResponse,
  ExplorerTransaction,
  TransactionHistoryItem,
  TransactionHistoryOptions,
  TransactionHistoryResult,
  TransactionType,
} from "../model/transactionHistoryTypes.js";
import { transactionHistoryModuleTypes } from "../transactionHistoryModuleTypes.js";

type AssetInfo = {
  ledgerId: string;
  name: string;
  ticker: string;
  decimals: number;
};

@injectable()
export class FetchTransactionHistoryUseCase {
  private readonly logger: LoggerPublisher;
  private tokenInfoCache: Map<string, AssetInfo> = new Map();

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(transactionHistoryModuleTypes.TransactionHistoryDataSource)
    private readonly dataSource: TransactionHistoryDataSource,
    @inject(balanceModuleTypes.CalDataSource)
    private readonly calDataSource: CalDataSource,
  ) {
    this.logger = loggerFactory("[FetchTransactionHistoryUseCase]");
  }

  async execute(
    blockchain: string,
    address: string,
    currencyId: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, TransactionHistoryResult>> {
    this.logger.debug("Fetching transaction history", {
      blockchain,
      address,
      currencyId,
      options,
    });

    const [transactionResult, currencyInfoResult] = await Promise.all([
      this.dataSource.getTransactions(blockchain, address, options),
      this.calDataSource.getCurrencyInformation(currencyId),
    ]);

    return await transactionResult.caseOf({
      Left: async (error) => {
        this.logger.error("Failed to fetch transaction history", { error });
        return Left(error);
      },
      Right: async (explorerResponse) => {
        const nativeAssetInfo: AssetInfo = currencyInfoResult.caseOf({
          Left: () => ({
            ledgerId: currencyId,
            name: currencyId,
            ticker: currencyId.toUpperCase(),
            decimals: 18,
          }),
          Right: (info) => ({
            ledgerId: info.id,
            name: info.name,
            ticker: info.ticker,
            decimals: info.decimals,
          }),
        });

        const transformedResult = await this.transformResponse(
          explorerResponse,
          address.toLowerCase(),
          currencyId,
          nativeAssetInfo,
        );

        this.logger.debug("Transaction history fetched successfully", {
          transactionCount: transformedResult.transactions.length,
          hasNextPage: !!transformedResult.nextPageToken,
        });

        return Right(transformedResult);
      },
    });
  }

  private async transformResponse(
    response: ExplorerResponse,
    normalizedAddress: string,
    currencyId: string,
    nativeAssetInfo: AssetInfo,
  ): Promise<TransactionHistoryResult> {
    const transactions = await Promise.all(
      response.data.map((tx) =>
        this.transformTransaction(
          tx,
          normalizedAddress,
          currencyId,
          nativeAssetInfo,
        ),
      ),
    );

    return {
      transactions,
      nextPageToken: response.token ?? undefined,
    };
  }

  private async transformTransaction(
    tx: ExplorerTransaction,
    normalizedAddress: string,
    currencyId: string,
    nativeAssetInfo: AssetInfo,
  ): Promise<TransactionHistoryItem> {
    const type = this.determineTransactionType(tx, normalizedAddress);
    const tokenTransfer = this.getRelevantTokenTransfer(
      tx,
      normalizedAddress,
      type,
    );

    let value: string;
    let assetInfo: AssetInfo;

    if (tokenTransfer) {
      value = tokenTransfer.count;
      assetInfo = await this.getTokenAssetInfo(
        tokenTransfer.contract,
        currencyId,
      );
    } else {
      value = this.getNativeValue(tx, normalizedAddress, type);
      assetInfo = nativeAssetInfo;
    }

    const formattedValue = formatBalance(
      value,
      assetInfo.decimals,
      assetInfo.ticker,
    );
    const timestamp = this.extractTimestamp(tx);

    return {
      hash: tx.hash,
      type,
      value,
      formattedValue,
      currencyName: assetInfo.name,
      ticker: assetInfo.ticker,
      timestamp,
      ledgerId: assetInfo.ledgerId,
    };
  }

  private getRelevantTokenTransfer(
    tx: ExplorerTransaction,
    normalizedAddress: string,
    type: TransactionType,
  ): EvmTransferEvent | null {
    const relevantTransfers = tx.transfer_events.filter((event) => {
      if (type === "received") {
        return event.to.toLowerCase() === normalizedAddress;
      }
      return event.from.toLowerCase() === normalizedAddress;
    });

    if (relevantTransfers.length === 0) {
      return null;
    }

    return relevantTransfers[0];
  }

  private async getTokenAssetInfo(
    contractAddress: string,
    currencyId: string,
  ): Promise<AssetInfo> {
    const cacheKey = `${currencyId}:${contractAddress.toLowerCase()}`;

    const cachedInfo = this.tokenInfoCache.get(cacheKey);
    if (cachedInfo) {
      return cachedInfo;
    }

    const tokenInfoResult = await this.calDataSource.getTokenInformation(
      contractAddress,
      currencyId,
    );

    const assetInfo: AssetInfo = tokenInfoResult.caseOf({
      Left: () => {
        this.logger.warn("Failed to fetch token info, using defaults", {
          contractAddress,
          currencyId,
        });
        return {
          ledgerId: `${currencyId}/erc20/unknown`,
          name: "Unknown Token",
          ticker: "???",
          decimals: 18,
        };
      },
      Right: (info: TokenInformation) => ({
        ledgerId: info.id,
        name: info.name,
        ticker: info.ticker,
        decimals: info.decimals,
      }),
    });

    this.tokenInfoCache.set(cacheKey, assetInfo);
    return assetInfo;
  }

  private determineTransactionType(
    tx: ExplorerTransaction,
    normalizedAddress: string,
  ): TransactionType {
    const isSender = tx.from.toLowerCase() === normalizedAddress;

    const isRecipientInTransfer = tx.transfer_events.some(
      (event) => event.to.toLowerCase() === normalizedAddress,
    );

    if (isSender && !isRecipientInTransfer) {
      return "sent";
    }

    return isRecipientInTransfer || tx.to.toLowerCase() === normalizedAddress
      ? "received"
      : "sent";
  }

  private getNativeValue(
    tx: ExplorerTransaction,
    normalizedAddress: string,
    type: TransactionType,
  ): string {
    const relevantActions = tx.actions.filter((action) => {
      if (type === "received") {
        return action.to.toLowerCase() === normalizedAddress;
      }
      return action.from.toLowerCase() === normalizedAddress;
    });

    if (relevantActions.length > 0) {
      const totalValue = relevantActions.reduce(
        (sum, action) => sum + BigInt(action.value),
        BigInt(0),
      );
      return totalValue.toString();
    }

    if (
      type === "received" &&
      tx.to.toLowerCase() === normalizedAddress &&
      tx.value !== "0"
    ) {
      return tx.value;
    }

    if (type === "sent" && tx.from.toLowerCase() === normalizedAddress) {
      return tx.value;
    }

    return "0";
  }

  private extractTimestamp(tx: ExplorerTransaction): string {
    return tx.block?.time ?? tx.received_at;
  }
}
