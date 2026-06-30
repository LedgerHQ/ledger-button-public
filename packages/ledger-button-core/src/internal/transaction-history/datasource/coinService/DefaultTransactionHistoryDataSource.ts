import { type Factory, inject, injectable } from "inversify";
import { Either, Left, type Maybe } from "purify-ts";

import type { BlockchainFamily } from "../../../../api/blockchain-provider/model/types.js";
import { blockchainProviderModuleTypes } from "../../../../internal/blockchain-provider/blockchainProviderModuleTypes.js";
import type { BlockchainProviderManager } from "../../../../internal/blockchain-provider/service/BlockchainProviderManager.js";
import { configModuleTypes } from "../../../config/configModuleTypes.js";
import { Config } from "../../../config/model/config.js";
import { loggerModuleTypes } from "../../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../../logger/service/LoggerPublisher.js";
import type { NetworkServiceOpts } from "../../../network/model/types.js";
import { networkModuleTypes } from "../../../network/networkModuleTypes.js";
import type { NetworkService } from "../../../network/NetworkService.js";
import { TransactionHistoryError } from "../../model/TransactionHistoryError.js";
import {
  TransactionDirection,
  TransactionHistoryEntry,
  TransactionHistoryEntryAsset,
  TransactionHistoryEntryFee,
  TransactionHistoryOptions,
  TransactionHistoryPage,
} from "../../model/transactionHistoryTypes.js";
import { normalizeAddressForCurrency } from "../../utils/normalizeAddressForCurrency.js";
import { resolveNetworkSlug } from "../../utils/resolveNetworkSlug.js";
import {
  CoinServiceAccountOperationDto,
  CoinServiceAccountOperationsResponseDto,
} from "./coinServiceDtos.js";
import type { TransactionHistoryDataSource } from "./TransactionHistoryDataSource.js";

const EPOCH_ISO = new Date(0).toISOString();
const FEES_OPERATION_SUFFIX = "-FEES";
const TRANSACTION_HISTORY_MAX_ITEMS = 20;

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
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly blockchainProviderManager: BlockchainProviderManager,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("DefaultTransactionHistoryDataSource");
  }

  async getTransactions(
    address: string,
    currencyId: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, TransactionHistoryPage>> {
    const family =
      this.blockchainProviderManager.resolveBlockchainFamily(currencyId);
    const networkSlug = resolveNetworkSlug(currencyId, family.extract());
    if (!networkSlug) {
      this.logger.warn("Unsupported currency for transaction history", {
        currencyId,
        address,
      });
      return Left(
        new TransactionHistoryError(
          `Unsupported currency for transaction history: ${currencyId}`,
          { address, currencyId },
        ),
      );
    }

    const requestUrl = this.buildRequestUrl(
      networkSlug,
      address,
      this.buildQueryParams(options),
    );

    const result =
      await this.networkService.get<CoinServiceAccountOperationsResponseDto>(
        requestUrl,
      );

    return result
      .mapLeft(
        (error) =>
          new TransactionHistoryError(
            `Failed to fetch transaction history for ${address}`,
            { address, currencyId, originalError: error.message },
          ),
      )
      .map((dto) =>
        this.mapDtoToPage(this.dropOperationsWithoutHash(dto), family),
      );
  }

  private buildQueryParams(options?: TransactionHistoryOptions): string {
    const params = new URLSearchParams();

    params.set("order", "desc");

    if (options?.pageToken) {
      params.set("cursor", options.pageToken);
    }

    return params.toString();
  }

  private buildRequestUrl(
    networkSlug: string,
    address: string,
    queryParams: string,
  ): string {
    const baseUrl = this.config.getCoinServiceUrl();
    return `${baseUrl}/v1/${networkSlug}/account/${address}/operations?${queryParams}`;
  }

  /**
   * The Coin Service API occasionally returns operations with a missing/empty
   * `tx.hash`. Drop them at the boundary so consumers can rely on every
   * surfaced operation having a usable hash.
   */
  private dropOperationsWithoutHash(
    dto: CoinServiceAccountOperationsResponseDto,
  ): CoinServiceAccountOperationsResponseDto {
    const items = dto.items ?? [];
    const kept = items.filter(
      (op) => typeof op.tx?.hash === "string" && op.tx.hash.length > 0,
    );

    if (kept.length !== items.length) {
      this.logger.warn("Dropped Coin Service operations without a tx hash", {
        received: items.length,
        kept: kept.length,
      });
    }

    return { ...dto, items: kept };
  }

  private mapDtoToPage(
    dto: CoinServiceAccountOperationsResponseDto,
    family: Maybe<BlockchainFamily>,
  ): TransactionHistoryPage {
    return {
      items: dto.items
        .slice(0, TRANSACTION_HISTORY_MAX_ITEMS)
        .map((op) => this.mapDtoToEntry(op, family)),
      nextPageToken: dto.next ?? undefined,
    };
  }

  private mapDtoToEntry(
    op: CoinServiceAccountOperationDto,
    family: Maybe<BlockchainFamily>,
  ): TransactionHistoryEntry {
    return {
      hash: op.tx.hash,
      value: this.resolveValue(op),
      senders: (op.senders ?? []).map((address) =>
        normalizeAddressForCurrency(address, family.extract()),
      ),
      recipients: (op.recipients ?? []).map((address) =>
        normalizeAddressForCurrency(address, family.extract()),
      ),
      fee: this.resolveFee(op, family),
      failed: op.tx?.failed === true,
      blockHeight: op.tx?.block?.height,
      timestamp: this.resolveTimestamp(op),
      asset: this.resolveAsset(op),
      direction: this.resolveDirection(op),
      isFeeOnlyOperation: this.detectFeeOnlyOperation(op),
    };
  }

  private resolveValue(op: CoinServiceAccountOperationDto): string {
    const detailsAmount = op.details?.assetAmount;
    if (detailsAmount && detailsAmount !== "0") {
      return detailsAmount;
    }
    return op.value ?? "0";
  }

  private resolveTimestamp(op: CoinServiceAccountOperationDto): string {
    return op.tx?.block?.time ?? op.tx?.date ?? EPOCH_ISO;
  }

  private resolveAsset(
    op: CoinServiceAccountOperationDto,
  ): TransactionHistoryEntryAsset {
    const asset = op.asset;
    if (!asset || asset.type === "native" || !asset.assetReference) {
      return { isNative: true };
    }
    return { isNative: false, contractAddress: asset.assetReference };
  }

  private resolveFee(
    op: CoinServiceAccountOperationDto,
    family: Maybe<BlockchainFamily>,
  ): TransactionHistoryEntryFee | undefined {
    const amount = op.tx?.fees;
    if (!amount || amount === "0") {
      return undefined;
    }
    const rawPayer = op.tx?.feesPayer;
    const payer = rawPayer
      ? normalizeAddressForCurrency(rawPayer, family.extract())
      : undefined;
    return payer ? { amount, payer } : { amount };
  }

  private resolveDirection(
    op: CoinServiceAccountOperationDto,
  ): TransactionDirection | undefined {
    if (op.type === "OUT") return "sent";
    if (op.type === "IN") return "received";
    return undefined;
  }

  private detectFeeOnlyOperation(op: CoinServiceAccountOperationDto): boolean {
    return op.id?.endsWith(FEES_OPERATION_SUFFIX) ?? false;
  }
}
