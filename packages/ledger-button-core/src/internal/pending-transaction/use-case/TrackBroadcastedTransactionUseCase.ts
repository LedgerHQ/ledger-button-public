import { type Factory, inject, injectable } from "inversify";

import { getActiveSelectedAccount } from "../../../api/model/ButtonCoreContext.js";
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
import { formatBalance } from "../../currency/currencyUtils.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { type PendingTransactionController } from "../controller/PendingTransactionController.js";
import { type PendingTransaction } from "../model/PendingTransaction.js";
import { pendingTransactionModuleTypes } from "../pendingTransactionModuleTypes.js";
import { type PendingTransactionStorageService } from "../service/PendingTransactionStorageService.js";
import { buildExplorerTransactionUrl } from "../utils/buildExplorerTransactionUrl.js";

type SignParams =
  | SignTransactionParams
  | SignRawTransactionParams
  | SignTypedMessageParams
  | SignPersonalMessageParams;

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
    const account = getActiveSelectedAccount(context);
    if (!account) return;

    const tx = await this.buildPendingTransaction(
      status.data.hash,
      account,
      context.chainId,
      params,
    );

    this.logger.debug("Tracking broadcasted transaction", { hash: tx.hash });
    this.storageService.add(tx);
    this.controller.track();
  }

  private async buildPendingTransaction(
    hash: string,
    account: Account,
    chainId: number,
    params: SignParams,
  ): Promise<PendingTransaction> {
    const { ticker, name, decimals, transactionExplorerUrlTemplate } =
      await this.resolveCurrencyMetadata(account.currencyId);
    const rawValue = isSignTransactionParams(params)
      ? params.transaction.value
      : "0";

    return {
      hash,
      chainId,
      address: account.freshAddress,
      timestamp: new Date().toISOString(),
      type: "sent",
      value: rawValue,
      formattedValue: formatBalance(
        rawValue,
        decimals,
        ticker,
        account.currencyId,
      ),
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
        decimals: undefined,
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
