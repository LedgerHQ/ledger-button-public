import { type Factory, inject, injectable } from "inversify";
import { BehaviorSubject, Observable } from "rxjs";

import { accountModuleTypes } from "../../account/accountModuleTypes.js";
import { type FetchSelectedAccountUseCase } from "../../account/use-case/fetchSelectedAccountUseCase.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import { type ContextService } from "../../context/ContextService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { type PendingTransaction } from "../model/PendingTransaction.js";
import { pendingTransactionModuleTypes } from "../pendingTransactionModuleTypes.js";
import { type PendingTransactionStorageService } from "../service/PendingTransactionStorageService.js";
import { type ConfirmPendingTransactionsUseCase } from "../use-case/ConfirmPendingTransactionsUseCase.js";
import { type HydratePendingTransactionsWithFiatUseCase } from "../use-case/HydratePendingTransactionsWithFiatUseCase.js";
import { type PendingTransactionController } from "./PendingTransactionController.js";

const POLLING_INTERVAL_MS = 10_000;

@injectable()
export class DefaultPendingTransactionController
  implements PendingTransactionController
{
  private readonly logger: LoggerPublisher;
  private readonly pendingTxSubject: BehaviorSubject<PendingTransaction[]>;
  private pollingInterval: ReturnType<typeof setInterval> | undefined;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(pendingTransactionModuleTypes.PendingTransactionStorageService)
    private readonly storageService: PendingTransactionStorageService,
    @inject(pendingTransactionModuleTypes.ConfirmPendingTransactionsUseCase)
    private readonly checkPendingStatus: ConfirmPendingTransactionsUseCase,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(
      pendingTransactionModuleTypes.HydratePendingTransactionsWithFiatUseCase,
    )
    private readonly hydratePendingTransactionsWithFiatUseCase: HydratePendingTransactionsWithFiatUseCase,
    @inject(accountModuleTypes.FetchSelectedAccountUseCase)
    private readonly fetchSelectedAccountUseCase: FetchSelectedAccountUseCase,
  ) {
    this.logger = loggerFactory("[PendingTransactionController]");
    this.pendingTxSubject = new BehaviorSubject<PendingTransaction[]>(
      this.storageService.getAll(),
    );
    this.startPollingWhenAccountAvailable();
  }

  track(): void {
    void this.emitCurrentState();
    this.startPolling();
  }

  observePendingTransactions(): Observable<PendingTransaction[]> {
    return this.pendingTxSubject;
  }

  private startPollingWhenAccountAvailable(): void {
    let preferredCurrency: string | undefined;

    this.contextService.observeContext().subscribe((context) => {
      const account = context.selectedAccount;
      const isHydrated = account && account.ticker && account.ticker.length > 0;
      if (isHydrated && this.storageService.getAll().length > 0) {
        this.startPolling();
      }

      if (
        preferredCurrency !== undefined &&
        context.preferredFiatCurrency !== preferredCurrency
      ) {
        this.emitCurrentState();
      }
      preferredCurrency = context.preferredFiatCurrency;
    });
  }

  private startPolling(): void {
    if (this.pollingInterval) return;
    this.logger.debug("Starting polling");
    this.pollingInterval = setInterval(
      () => this.pollTick(),
      POLLING_INTERVAL_MS,
    );
  }

  private stopPolling(): void {
    if (!this.pollingInterval) return;
    this.logger.debug("Stopping polling, all transactions confirmed");
    clearInterval(this.pollingInterval);
    this.pollingInterval = undefined;
  }

  private async pollTick(): Promise<void> {
    const context = this.contextService.getContext();
    const account = context.selectedAccount;
    if (!account) return;

    const pending = this.storageService.getAll();
    if (pending.length === 0) {
      this.stopPolling();
      return;
    }

    const pendingHashes = pending.map((tx) => tx.hash);

    const result = await this.checkPendingStatus.execute(
      account.ticker.toLowerCase(),
      account.freshAddress,
      pendingHashes,
    );

    if (result.isLeft()) {
      this.logger.warn("Failed to check pending transactions", {
        error: result.extract(),
      });
      return;
    }

    const confirmedHashes = result.unsafeCoerce();

    for (const hash of confirmedHashes) {
      this.storageService.remove(hash);
    }

    this.emitCurrentState();

    if (confirmedHashes.length > 0) {
      this.refreshSelectedAccount();
    }

    if (this.storageService.getAll().length === 0) {
      this.stopPolling();
    }
  }

  private async refreshSelectedAccount(): Promise<void> {
    this.logger.debug("Refreshing transaction history after confirmation");
    const result = await this.fetchSelectedAccountUseCase.execute();
    if (result.isLeft()) {
      this.logger.warn("Failed to refresh transaction history", {
        error: result.extract(),
      });
    }
  }

  private async emitCurrentState(): Promise<void> {
    const hydratedTxs = this.hydratePendingTransactionsWithFiatUseCase.execute(
      this.storageService.getAll(),
      this.contextService.getContext().preferredFiatCurrency,
    );
    this.pendingTxSubject.next(await hydratedTxs);
  }
}
