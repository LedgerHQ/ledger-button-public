import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { balanceModuleTypes } from "../../balance/balanceModuleTypes.js";
import type { CalDataSource } from "../../balance/datasource/cal/CalDataSource.js";
import type { TokenInformation } from "../../balance/datasource/cal/calTypes.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { TransactionHistoryDataSource } from "../datasource/coinService/TransactionHistoryDataSource.js";
import { transactionHistoryModuleTypes } from "../di/transactionHistoryModuleTypes.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import {
  TransactionHistoryEntry,
  TransactionHistoryOptions,
  TransactionHistoryPage,
  TransactionHistoryResult,
} from "../model/transactionHistoryTypes.js";
import {
  AssetInfo,
  buildTransactionHistoryItem,
} from "./buildTransactionHistoryItem.js";

@injectable()
export class FetchTransactionHistoryUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(transactionHistoryModuleTypes.TransactionHistoryDataSource)
    private readonly dataSource: TransactionHistoryDataSource,
    @inject(balanceModuleTypes.CalDataSource)
    private readonly calDataSource: CalDataSource,
  ) {
    this.logger = loggerFactory("FetchTransactionHistoryUseCase");
  }

  async execute(
    address: string,
    currencyId: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, TransactionHistoryResult>> {
    this.logger.debug("Fetching transaction history", {
      address,
      currencyId,
      options,
    });

    const [transactionResult, currencyInfoResult] = await Promise.all([
      this.dataSource.getTransactions(address, currencyId, options),
      this.calDataSource.getCurrencyInformation(currencyId),
    ]);

    return await transactionResult.caseOf({
      Left: async (error) => {
        this.logger.error("Failed to fetch transaction history", { error });
        return Left(error);
      },
      Right: async (page) => {
        const nativeAssetInfo = currencyInfoResult.caseOf({
          Left: () => this.buildFallbackNativeAssetInfo(currencyId),
          Right: (info) => ({
            ledgerId: info.id,
            name: info.name,
            ticker: info.ticker,
            decimals: info.decimals,
          }),
        });
        const transactionExplorerUrlTemplate = currencyInfoResult
          .toMaybe()
          .extract()?.transactionExplorerUrlTemplate;

        const transformedResult = await this.transformPage(
          page,
          address.toLowerCase(),
          currencyId,
          nativeAssetInfo,
          transactionExplorerUrlTemplate,
        );

        this.logger.debug("Transaction history fetched successfully", {
          rawEntryCount: page.items.length,
          transactionCount: transformedResult.transactions.length,
          hasNextPage: !!transformedResult.nextPageToken,
        });

        return Right(transformedResult);
      },
    });
  }

  private buildFallbackNativeAssetInfo(currencyId: string): AssetInfo {
    return {
      ledgerId: currencyId,
      name: currencyId,
      ticker: currencyId.toUpperCase(),
      decimals: 18,
    };
  }

  private async transformPage(
    page: TransactionHistoryPage,
    normalizedAddress: string,
    currencyId: string,
    nativeAssetInfo: AssetInfo,
    transactionExplorerUrlTemplate: string | undefined,
  ): Promise<TransactionHistoryResult> {
    const transactions = await Promise.all(
      page.items.map(async (entry) => {
        const assetInfo = await this.resolveAssetInfo(
          entry,
          currencyId,
          nativeAssetInfo,
        );
        return buildTransactionHistoryItem({
          entry,
          normalizedAddress,
          assetInfo,
          nativeAssetInfo,
        });
      }),
    );

    return {
      transactions,
      transactionExplorerUrlTemplate,
      nextPageToken: page.nextPageToken,
    };
  }

  private async resolveAssetInfo(
    entry: TransactionHistoryEntry,
    currencyId: string,
    nativeAssetInfo: AssetInfo,
  ): Promise<AssetInfo> {
    if (entry.asset.isNative) {
      return nativeAssetInfo;
    }
    return this.resolveTokenAssetInfo(entry.asset.contractAddress, currencyId);
  }

  private async resolveTokenAssetInfo(
    contractAddress: string,
    currencyId: string,
  ): Promise<AssetInfo> {
    const tokenInfoResult = await this.calDataSource.getTokenInformation(
      contractAddress,
      currencyId,
    );

    return tokenInfoResult.caseOf({
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
  }
}
