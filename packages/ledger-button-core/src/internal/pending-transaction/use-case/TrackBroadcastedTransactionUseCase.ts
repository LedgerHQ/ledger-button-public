import { type Factory, inject, injectable } from "inversify";

import { isBroadcastedTransactionResult } from "../../../api/model/signing/SignedTransaction.js";
import { type SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import type { SignPersonalMessageParams } from "../../../api/model/signing/SignPersonalMessageParams.js";
import type { SignRawTransactionParams } from "../../../api/model/signing/SignRawTransactionParams.js";
import {
  isSignTransactionParams,
  type SignTransactionParams,
} from "../../../api/model/signing/SignTransactionParams.js";
import type { SignTypedMessageParams } from "../../../api/model/signing/SignTypedMessageParams.js";
import { type Account } from "../../account/service/AccountService.js";
import { balanceModuleTypes } from "../../balance/balanceModuleTypes.js";
import { type CalDataSource } from "../../balance/datasource/cal/CalDataSource.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import { type ContextService } from "../../context/ContextService.js";
import { formatBalance } from "../../currency/formatCurrency.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { buildExplorerTransactionUrl } from "../../transaction/utils/buildExplorerTransactionUrl.js";
import { type PendingTransactionController } from "../controller/PendingTransactionController.js";
import { type PendingTransaction } from "../model/PendingTransaction.js";
import { pendingTransactionModuleTypes } from "../pendingTransactionModuleTypes.js";
import { type PendingTransactionStorageService } from "../service/PendingTransactionStorageService.js";

type SignParams =
  | SignTransactionParams
  | SignRawTransactionParams
  | SignTypedMessageParams
  | SignPersonalMessageParams;

const FALLBACK_DECIMALS = 18;

@injectable()
export class TrackBroadcastedTransactionUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(pendingTransactionModuleTypes.PendingTransactionStorageService)
    private readonly storageService: PendingTransactionStorageService,
    @inject(pendingTransactionModuleTypes.PendingTransactionController)
    private readonly controller: PendingTransactionController,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(balanceModuleTypes.CalDataSource)
    private readonly calDataSource: CalDataSource,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("[TrackBroadcastedTransactionUseCase]");
  }

  async execute(status: SignFlowStatus, params: SignParams): Promise<void> {
    if (status.status !== "success") return;
    if (!isBroadcastedTransactionResult(status.data)) return;

    const context = this.contextService.getContext();
    if (!context.selectedAccount) return;

    const minimalTx = this.buildMinimalPendingTransaction(
      status.data.hash,
      context.selectedAccount,
      context.chainId,
      params,
    );

    this.logger.debug("Tracking broadcasted transaction", {
      hash: minimalTx.hash,
    });
    this.storageService.add(minimalTx);
    this.controller.track();

    await this.enrichPendingTransaction(minimalTx, context.selectedAccount);
  }

  private buildMinimalPendingTransaction(
    hash: string,
    account: Account,
    chainId: number,
    params: SignParams,
  ): PendingTransaction {
    const rawValue = isSignTransactionParams(params)
      ? params.transaction.value
      : "0";
    const fallbackTicker = account.ticker || account.currencyId.toUpperCase();
    const fallbackName = account.name || account.currencyId;

    return {
      hash,
      chainId,
      address: account.freshAddress,
      timestamp: new Date().toISOString(),
      type: "sent",
      value: rawValue,
      formattedValue: formatBalance(rawValue, FALLBACK_DECIMALS, fallbackTicker),
      ticker: fallbackTicker,
      currencyName: fallbackName,
      ledgerId: account.currencyId,
    };
  }

  private async enrichPendingTransaction(
    tx: PendingTransaction,
    account: Account,
  ): Promise<void> {
    const { ticker, name, decimals, transactionExplorerUrlTemplate } =
      await this.resolveCurrencyMetadata(
      account.currencyId,
    );

    const enrichedTx: PendingTransaction = {
      ...tx,
      ticker,
      currencyName: name,
      formattedValue: formatBalance(tx.value, decimals, ticker),
      explorerUrl:
        buildExplorerTransactionUrl(transactionExplorerUrlTemplate, tx.hash) ??
        undefined,
    };

    this.storageService.update(enrichedTx);
    this.controller.track();
  }

  private async resolveCurrencyMetadata(
    currencyId: string,
  ): Promise<{
    ticker: string;
    name: string;
    decimals: number;
    transactionExplorerUrlTemplate?: string;
  }> {
    const currencyInfo =
      await this.calDataSource.getCurrencyInformation(currencyId);

    return currencyInfo.caseOf({
      Left: () => ({
        ticker: currencyId.toUpperCase(),
        name: currencyId,
        decimals: FALLBACK_DECIMALS,
      }),
      Right: (info) => ({
        ticker: info.ticker,
        name: info.name,
        decimals: info.decimals,
        transactionExplorerUrlTemplate: info.transactionExplorerUrlTemplate,
      }),
    });
  }
}
