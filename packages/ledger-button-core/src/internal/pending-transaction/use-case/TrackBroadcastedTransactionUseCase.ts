import { type Factory, inject, injectable } from "inversify";

import type { ProviderSignParams } from "@api/blockchain-provider/model/types.js";
import type { Account } from "@api/model/Account.js";
import {
  DEFAULT_BLOCKCHAIN_FAMILY,
  getSelectedAccount,
} from "@api/model/ButtonCoreContext.js";
import { isBroadcastedTransactionResult } from "@api/model/signing/SignedTransaction.js";
import { type SignFlowStatus } from "@api/model/signing/SignFlowStatus.js";
import { getSignParamsFamily } from "@api/model/signing/signParamsFamily.js";
import { isSignTransactionParams } from "@api/model/signing/SignTransactionParams.js";
import { type CalDataSource } from "@internal/balance/datasource/cal/CalDataSource.js";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes.js";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes.js";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager.js";
import { type ContextService } from "@internal/context/ContextService.js";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes.js";
import { formatBalance } from "@internal/currency/currencyUtils.js";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes.js";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher.js";

import { type PendingTransactionController } from "../controller/PendingTransactionController.js";
import { pendingTransactionModuleTypes } from "../di/pendingTransactionModuleTypes.js";
import { type PendingTransaction } from "../model/PendingTransaction.js";
import { buildExplorerTransactionUrl } from "../utils/buildExplorerTransactionUrl.js";

@injectable()
export class TrackBroadcastedTransactionUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(pendingTransactionModuleTypes.PendingTransactionController)
    private readonly controller: PendingTransactionController,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(balanceModuleTypes.CalDataSource)
    private readonly calDataSource: CalDataSource,
    @inject(blockchainProviderModuleTypes.BlockchainProviderManager)
    private readonly blockchainProviderManager: BlockchainProviderManager,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("[TrackBroadcastedTransactionUseCase]");
  }

  async execute(
    status: SignFlowStatus,
    params: ProviderSignParams,
  ): Promise<void> {
    if (status.status !== "success") return;
    if (!isBroadcastedTransactionResult(status.data)) return;

    const context = this.contextService.getContext();
    const family = getSignParamsFamily(params);
    const account = getSelectedAccount(context, family);
    if (!account) return;

    // `context.chainId` is EVM-only; it is meaningless for non-EVM families.
    const chainId = family === DEFAULT_BLOCKCHAIN_FAMILY ? context.chainId : 0;

    const tx = await this.buildPendingTransaction(
      status.data.hash,
      account,
      chainId,
      params,
    );

    this.logger.debug("Tracking broadcasted transaction", { hash: tx.hash });
    this.controller.registerBroadcastedTransaction(tx);
  }

  private async buildPendingTransaction(
    hash: string,
    account: Account,
    chainId: number,
    params: ProviderSignParams,
  ): Promise<PendingTransaction> {
    const { ticker, name, decimals, transactionExplorerUrlTemplate } =
      await this.resolveCurrencyMetadata(account.currencyId);
    // Only structured EVM params carry the amount. A raw EVM transaction or a
    // serialized Solana one would have to be decoded, so the amount stays unset
    // rather than being reported as zero.
    const rawValue = isSignTransactionParams(params)
      ? params.transaction.value
      : undefined;

    return {
      hash,
      chainId,
      address: account.freshAddress,
      timestamp: new Date().toISOString(),
      type: "sent",
      value: rawValue,
      formattedValue:
        rawValue === undefined || decimals === undefined
          ? undefined
          : formatBalance(rawValue, decimals, ticker),
      ticker,
      currencyName: name,
      ledgerId: account.currencyId,
      explorerUrl:
        buildExplorerTransactionUrl(transactionExplorerUrlTemplate, hash) ??
        undefined,
    };
  }

  private async resolveCurrencyMetadata(currencyId: string): Promise<{
    ticker: string;
    name: string;
    decimals: number | undefined;
    transactionExplorerUrlTemplate?: string;
  }> {
    const currencyInfo =
      await this.calDataSource.getCurrencyInformation(currencyId);

    return currencyInfo.caseOf<{
      ticker: string;
      name: string;
      decimals: number | undefined;
      transactionExplorerUrlTemplate?: string;
    }>({
      Left: () => ({
        ticker: currencyId.toUpperCase(),
        name: currencyId,
        decimals: this.nativeDecimals(currencyId),
      }),
      Right: (info) => ({
        ticker: info.ticker,
        name: info.name,
        decimals: info.decimals,
        transactionExplorerUrlTemplate: info.transactionExplorerUrlTemplate,
      }),
    });
  }

  /** Last-resort decimals when CAL has no metadata for the currency. */
  private nativeDecimals(currencyId: string): number | undefined {
    const decimals =
      this.blockchainProviderManager.getNativeDecimals(currencyId);

    if (decimals.isNothing()) {
      this.logger.warn("Unresolved decimals, reporting no formatted amount", {
        currencyId,
      });
    }

    return decimals.extract();
  }
}
