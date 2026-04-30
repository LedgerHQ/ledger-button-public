import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { balanceModuleTypes } from "../../balance/balanceModuleTypes.js";
import type { CalDataSource } from "../../balance/datasource/cal/CalDataSource.js";
import type { TokenInformation } from "../../balance/datasource/cal/calTypes.js";
import { formatBalance } from "../../currency/currencyUtils.js";
import { EVM_MAPPING_TABLE } from "../../evm-provider/utils/chainUtils.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { buildExplorerTransactionUrl } from "../../transaction/utils/buildExplorerTransactionUrl.js";
import type { TransactionHistoryDataSource } from "../datasource/TransactionHistoryDataSource.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import {
  AlpacaOperation,
  AlpacaOperationsResponse,
  TransactionDirection,
  TransactionHistoryItem,
  TransactionHistoryOptions,
  TransactionHistoryResult,
  TransactionKind,
  TransactionStatus,
  TransactionType,
} from "../model/transactionHistoryTypes.js";
import { transactionHistoryModuleTypes } from "../transactionHistoryModuleTypes.js";

type AssetInfo = {
  ledgerId: string;
  name: string;
  ticker: string;
  decimals: number;
};

const FEES_OPERATION_SUFFIX = "-FEES";

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

    const network = this.resolveAlpacaNetwork(currencyId);
    if (!network) {
      const error = new TransactionHistoryError(
        `Unsupported network for Alpaca transaction history: ${currencyId}`,
        { address, network: currencyId },
      );
      this.logger.warn("Unsupported network for Alpaca transaction history", {
        currencyId,
        address,
      });
      return Left(error);
    }

    const [transactionResult, currencyInfoResult] = await Promise.all([
      this.dataSource.getTransactions(network, address, options),
      this.calDataSource.getCurrencyInformation(currencyId),
    ]);

    return await transactionResult.caseOf({
      Left: async (error) => {
        this.logger.error("Failed to fetch transaction history", { error });
        return Left(error);
      },
      Right: async (alpacaResponse) => {
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
        const transactionExplorerUrlTemplate = currencyInfoResult
          .toMaybe()
          .extract()?.transactionExplorerUrlTemplate;

        const transformedResult = await this.transformResponse(
          alpacaResponse,
          address.toLowerCase(),
          currencyId,
          nativeAssetInfo,
          transactionExplorerUrlTemplate,
        );

        this.logger.debug("Transaction history fetched successfully", {
          rawOperationCount: alpacaResponse.items?.length ?? 0,
          transactionCount: transformedResult.transactions.length,
          hasNextPage: !!transformedResult.nextPageToken,
        });

        return Right(transformedResult);
      },
    });
  }

  private resolveAlpacaNetwork(currencyId: string): string | undefined {
    if (Object.hasOwn(EVM_MAPPING_TABLE, currencyId)) {
      return currencyId;
    }
    return undefined;
  }

  private async transformResponse(
    response: AlpacaOperationsResponse,
    normalizedAddress: string,
    currencyId: string,
    nativeAssetInfo: AssetInfo,
    transactionExplorerUrlTemplate: string | undefined,
  ): Promise<TransactionHistoryResult> {
    const operations = response.items ?? [];
    const transformed = await Promise.all(
      operations.map((op) =>
        this.transformOperation(
          op,
          normalizedAddress,
          currencyId,
          nativeAssetInfo,
          transactionExplorerUrlTemplate,
        ),
      ),
    );

    return {
      transactions: transformed.filter(
        (item): item is TransactionHistoryItem => item !== null,
      ),
      nextPageToken: response.next ?? undefined,
    };
  }

  private async transformOperation(
    op: AlpacaOperation,
    normalizedAddress: string,
    currencyId: string,
    nativeAssetInfo: AssetInfo,
    transactionExplorerUrlTemplate: string | undefined,
  ): Promise<TransactionHistoryItem | null> {
    if (!op) {
      this.logger.warn("Skipping null/undefined operation");
      return null;
    }

    if (typeof op.tx?.hash !== "string" || op.tx.hash.length === 0) {
      this.logger.warn("Operation has missing/invalid hash, surfacing anyway", {
        id: op.id,
        type: op.type,
        date: op.tx?.date,
        hasSenders: Array.isArray(op.senders) && op.senders.length > 0,
        hasRecipients: Array.isArray(op.recipients) && op.recipients.length > 0,
        hash: op.tx?.hash,
      });
    }

    const direction = this.determineDirection(op, normalizedAddress);
    const kind = this.determineKind(op);
    const status = this.determineStatus(op);
    const assetInfo = await this.resolveAssetInfo(
      op,
      currencyId,
      nativeAssetInfo,
    );

    const value = this.computeValue(op);
    const formattedValue = formatBalance(
      value,
      assetInfo.decimals,
      assetInfo.ticker,
    );
    const timestamp = this.extractTimestamp(op);
    const { fee, formattedFee, feeTicker } = this.extractFee(
      op,
      normalizedAddress,
      nativeAssetInfo,
    );

    return {
      hash: op.tx.hash,
      type: this.toLegacyType(direction),
      direction,
      kind,
      status,
      value,
      formattedValue,
      currencyName: assetInfo.name,
      ticker: assetInfo.ticker,
      timestamp,
      blockHeight: op.tx?.block?.height,
      ledgerId: assetInfo.ledgerId,
      explorerUrl:
        buildExplorerTransactionUrl(
          transactionExplorerUrlTemplate,
          op.tx?.hash ?? "",
        ) ?? undefined,
      fee,
      formattedFee,
      feeTicker,
    };
  }

  private determineDirection(
    op: AlpacaOperation,
    normalizedAddress: string,
  ): TransactionDirection {
    const isSender = (op.senders ?? []).some(
      (address) => address?.toLowerCase() === normalizedAddress,
    );
    const isRecipient = (op.recipients ?? []).some(
      (address) => address?.toLowerCase() === normalizedAddress,
    );

    if (isSender && isRecipient) {
      return "self";
    }
    if (isSender) {
      return "sent";
    }
    if (isRecipient) {
      return "received";
    }

    // Fall back to the explicit OUT/IN type when the user address is missing
    // from both arrays (e.g. FEES-only failed operations on EVM).
    if (op.type === "OUT") {
      return "sent";
    }
    if (op.type === "IN") {
      return "received";
    }
    return "self";
  }

  private determineKind(op: AlpacaOperation): TransactionKind {
    if (this.isFeesOperation(op)) {
      return "contract";
    }
    return "transfer";
  }

  private determineStatus(op: AlpacaOperation): TransactionStatus {
    return op.tx?.failed === true ? "failed" : "confirmed";
  }

  private toLegacyType(direction: TransactionDirection): TransactionType {
    return direction === "received" ? "received" : "sent";
  }

  private extractFee(
    op: AlpacaOperation,
    normalizedAddress: string,
    nativeAssetInfo: AssetInfo,
  ): { fee?: string; formattedFee?: string; feeTicker?: string } {
    const fee = op.tx?.fees;
    if (!fee || fee === "0") {
      return {};
    }

    const feesPayer = op.tx?.feesPayer?.toLowerCase();
    if (feesPayer && feesPayer !== normalizedAddress) {
      return {};
    }

    return {
      fee,
      formattedFee: formatBalance(
        fee,
        nativeAssetInfo.decimals,
        nativeAssetInfo.ticker,
      ),
      feeTicker: nativeAssetInfo.ticker,
    };
  }

  private async resolveAssetInfo(
    op: AlpacaOperation,
    currencyId: string,
    nativeAssetInfo: AssetInfo,
  ): Promise<AssetInfo> {
    const asset = op.asset;
    if (!asset || asset.type === "native" || !asset.assetReference) {
      return nativeAssetInfo;
    }

    return this.getTokenAssetInfo(asset.assetReference, currencyId);
  }

  private computeValue(op: AlpacaOperation): string {
    const detailsAmount = op.details?.assetAmount;
    if (detailsAmount && detailsAmount !== "0") {
      return detailsAmount;
    }
    return op.value ?? "0";
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

  private extractTimestamp(op: AlpacaOperation): string {
    return op.tx?.block?.time ?? op.tx?.date ?? new Date(0).toISOString();
  }

  private isFeesOperation(op: AlpacaOperation): boolean {
    return op.id?.endsWith(FEES_OPERATION_SUFFIX) ?? false;
  }
}
