import { type Factory, inject, injectable } from "inversify";

import type { BroadcastedTransactionMetadata } from "@api/blockchain-provider/model/types";
import type { Account } from "@api/model/Account";
import {
  DEFAULT_BLOCKCHAIN_FAMILY,
  getSelectedAccount,
} from "@api/model/ButtonCoreContext";
import { isBroadcastedTransactionResult } from "@api/model/signing/SignedTransaction";
import { type SignFlowStatus } from "@api/model/signing/SignFlowStatus";
import { type CalDataSource } from "@internal/balance/datasource/cal/CalDataSource";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes";
import { blockchainProviderModuleTypes } from "@internal/blockchain-provider/di/blockchainProviderModuleTypes";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import { type ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { formatBalance } from "@internal/currency/currencyUtils";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { type PendingTransactionController } from "../controller/PendingTransactionController";
import { pendingTransactionModuleTypes } from "../di/pendingTransactionModuleTypes";
import { type PendingTransaction } from "../model/PendingTransaction";
import { buildExplorerTransactionUrl } from "../utils/buildExplorerTransactionUrl";

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
    metadata: BroadcastedTransactionMetadata,
  ): Promise<void> {
    if (status.status !== "success") return;
    if (!isBroadcastedTransactionResult(status.data)) return;

    const context = this.contextService.getContext();
    const { family, value } = metadata;
    const account = getSelectedAccount(context, family);
    if (!account) return;

    // `context.chainId` is EVM-only; it is meaningless for non-EVM families.
    const chainId = family === DEFAULT_BLOCKCHAIN_FAMILY ? context.chainId : 0;

    const tx = await this.buildPendingTransaction(
      status.data.hash,
      account,
      chainId,
      value,
    );

    this.logger.debug("Tracking broadcasted transaction", { hash: tx.hash });
    this.controller.registerBroadcastedTransaction(tx);
  }

  private async buildPendingTransaction(
    hash: string,
    account: Account,
    chainId: number,
    value: string | undefined,
  ): Promise<PendingTransaction> {
    const { ticker, name, decimals, transactionExplorerUrlTemplate } =
      await this.resolveCurrencyMetadata(account.currencyId);
    return {
      hash,
      chainId,
      address: account.freshAddress,
      timestamp: new Date().toISOString(),
      type: "sent",
      value,
      formattedValue:
        value === undefined || decimals === undefined
          ? undefined
          : formatBalance(value, decimals, ticker),
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
    const decimals = this.blockchainProviderManager
      .describeCurrency(currencyId)
      .map((currency) => currency.nativeDecimals);

    if (decimals.isNothing()) {
      this.logger.warn("Unresolved decimals, reporting no formatted amount", {
        currencyId,
      });
    }

    return decimals.extract();
  }
}
