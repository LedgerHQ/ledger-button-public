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
  AlpacaOperationParty,
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

  // TODO: drop the legacy `blockchain` arg once HydrateAccountWithTxHistoryUseCase is updated to pass currencyId only.
  async execute(
    _blockchain: string,
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
          rawOperationCount: alpacaResponse.data?.length ?? 0,
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
    const operations = response.data ?? [];
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
      nextPageToken: response.token ?? undefined,
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

    if (typeof op.hash !== "string" || op.hash.length === 0) {
      this.logger.warn("Operation has missing/invalid hash, surfacing anyway", {
        type: op.type,
        date: op.date,
        hasSenders: Array.isArray(op.senders) && op.senders.length > 0,
        hasRecipients: Array.isArray(op.recipients) && op.recipients.length > 0,
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

    const value = this.computeValue(op, normalizedAddress, direction);
    const formattedValue = formatBalance(
      value,
      assetInfo.decimals,
      assetInfo.ticker,
    );
    const timestamp = this.extractTimestamp(op);
    const { fee, formattedFee, feeTicker } = this.extractFee(
      op,
      nativeAssetInfo,
    );

    return {
      hash: op.hash ?? "",
      type: this.toLegacyType(direction),
      direction,
      kind,
      status,
      value,
      formattedValue,
      currencyName: assetInfo.name,
      ticker: assetInfo.ticker,
      timestamp,
      blockHeight: op.blockHeight,
      ledgerId: assetInfo.ledgerId,
      explorerUrl:
        buildExplorerTransactionUrl(transactionExplorerUrlTemplate, op.hash) ??
        undefined,
      fee,
      formattedFee,
      feeTicker,
      errorMessage: op.errorMessage,
    };
  }

  private determineDirection(
    op: AlpacaOperation,
    normalizedAddress: string,
  ): TransactionDirection {
    const isSender = (op.senders ?? []).some(
      (party) => party.address?.toLowerCase() === normalizedAddress,
    );
    const isRecipient = (op.recipients ?? []).some(
      (party) => party.address?.toLowerCase() === normalizedAddress,
    );

    if (isSender && isRecipient) {
      return "self";
    }
    return isSender ? "sent" : "received";
  }

  private determineKind(op: AlpacaOperation): TransactionKind {
    const t = (op.type ?? "").toLowerCase();
    if (t.length === 0) {
      return "unknown";
    }
    if (t.includes("swap")) {
      return "swap";
    }
    if (t.includes("approve") || t === "approval") {
      return "approve";
    }
    if (
      t === "send" ||
      t === "receive" ||
      t === "transfer" ||
      t === "token-transfer" ||
      t === "token_transfer"
    ) {
      return "transfer";
    }
    return "contract";
  }

  private determineStatus(op: AlpacaOperation): TransactionStatus {
    if (op.status === "failed" || op.errorMessage) {
      return "failed";
    }
    if (op.status === "pending") {
      return "pending";
    }
    return "confirmed";
  }

  private toLegacyType(direction: TransactionDirection): TransactionType {
    return direction === "received" ? "received" : "sent";
  }

  private extractFee(
    op: AlpacaOperation,
    nativeAssetInfo: AssetInfo,
  ): { fee?: string; formattedFee?: string; feeTicker?: string } {
    if (!op.fee || op.fee === "0") {
      return {};
    }
    return {
      fee: op.fee,
      formattedFee: formatBalance(
        op.fee,
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

  private computeValue(
    op: AlpacaOperation,
    normalizedAddress: string,
    direction: TransactionDirection,
  ): string {
    if (op.value && op.value !== "0") {
      return op.value;
    }

    const parties: AlpacaOperationParty[] =
      direction === "received" ? (op.recipients ?? []) : (op.senders ?? []);

    const matching = parties.filter(
      (party) => party.address?.toLowerCase() === normalizedAddress,
    );

    if (matching.length === 0) {
      return op.value ?? "0";
    }

    const total = matching.reduce((sum, party) => {
      if (!party.amount) {
        return sum;
      }
      try {
        return sum + BigInt(party.amount);
      } catch {
        return sum;
      }
    }, BigInt(0));

    return total.toString();
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
    return op.blockTime ?? op.date;
  }
}
