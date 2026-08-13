import { type Factory, inject, injectable } from "inversify";
import { BehaviorSubject, filter, Observable } from "rxjs";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types.js";
import {
  getActiveFamily,
  getActiveSelectedAccount,
} from "@api/model/ButtonCoreContext.js";
import { accountModuleTypes } from "@internal/account/di/accountModuleTypes.js";
import { type FetchSelectedAccountUseCase } from "@internal/account/use-case/fetchSelectedAccountUseCase.js";
import { type ContextService } from "@internal/context/ContextService.js";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes.js";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes.js";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher.js";

import { pendingTransactionModuleTypes } from "../di/pendingTransactionModuleTypes.js";
import { type BroadcastTracking } from "../model/BroadcastTracking.js";
import { type PendingTransaction } from "../model/PendingTransaction.js";
import { type PendingTransactionStorageService } from "../service/PendingTransactionStorageService.js";
import {
  type ConfirmPendingTransactionsUseCase,
  type SettledPendingTransactionOutcome,
} from "../use-case/ConfirmPendingTransactionsUseCase.js";
import { type HydratePendingTransactionsWithFiatUseCase } from "../use-case/HydratePendingTransactionsWithFiatUseCase.js";
import { type PendingTransactionController } from "./PendingTransactionController.js";

const POLLING_INTERVAL_MS = 10_000;

@injectable()
export class DefaultPendingTransactionController
  implements PendingTransactionController
{
  private readonly logger: LoggerPublisher;
  private readonly pendingTxSubject: BehaviorSubject<PendingTransaction[]>;
  /**
   * Per-hash lifecycle. `null` means "not registered yet", which is what lets
   * a subscriber attach before the transaction reaches the pool.
   */
  private readonly broadcastTracking = new Map<
    string,
    BehaviorSubject<BroadcastTracking | null>
  >();
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

  registerBroadcastedTransaction(tx: PendingTransaction): void {
    this.storageService.add(tx);
    this.broadcastTrackingFor(tx.hash).next({
      hash: tx.hash,
      state: "processing",
      explorerUrl: tx.explorerUrl,
    });
    this.track();
  }

  observeBroadcastedTransaction(hash: string): Observable<BroadcastTracking> {
    return this.broadcastTrackingFor(hash).pipe(
      filter((tracking): tracking is BroadcastTracking => tracking !== null),
    );
  }

  private broadcastTrackingFor(
    hash: string,
  ): BehaviorSubject<BroadcastTracking | null> {
    const existing = this.broadcastTracking.get(hash);
    if (existing) {
      return existing;
    }
    const subject = new BehaviorSubject<BroadcastTracking | null>(null);
    this.broadcastTracking.set(hash, subject);
    return subject;
  }

  private settleBroadcastTracking(hash: string): void {
    const subject = this.broadcastTracking.get(hash);
    const current = subject?.value;
    if (!subject || !current) return;
    subject.next({ ...current, state: "validated" });
  }

  private startPollingWhenAccountAvailable(): void {
    let preferredCurrency: string | undefined;

    this.contextService.observeContext().subscribe((context) => {
      const account = getActiveSelectedAccount(context);
      const isHydrated = account && account.ticker && account.ticker.length > 0;
      if (isHydrated && this.storageService.getAll().length > 0) {
        this.startPolling();
      }

      if (
        preferredCurrency !== undefined &&
        context.preferredFiatCurrency !== preferredCurrency
      ) {
        void this.emitCurrentState();
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
    const pending = this.storageService.getAll();
    if (pending.length === 0) {
      this.stopPolling();
      return;
    }

    const settledOutcomes = await this.confirmPendingByAccount(pending);
    const settledTxs = this.removeSettled(pending, settledOutcomes);

    await this.emitUpdate();

    if (settledTxs.length > 0) {
      void this.refreshSettledAccounts(settledTxs);
    }

    if (this.storageService.getAll().length === 0) {
      this.stopPolling();
    }
  }

  private removeSettled(
    pending: PendingTransaction[],
    settledOutcomes: SettledPendingTransactionOutcome[],
  ): PendingTransaction[] {
    const settledHashes = new Set(settledOutcomes.map(({ hash }) => hash));
    for (const hash of settledHashes) {
      this.storageService.remove(hash);
      this.settleBroadcastTracking(hash);
    }
    return pending.filter((tx) => settledHashes.has(tx.hash));
  }

  /**
   * Each pending tx carries the account it was broadcast from, so a mixed
   * EVM/Solana list is checked against the right explorer for each family.
   */
  private async confirmPendingByAccount(
    pending: PendingTransaction[],
  ): Promise<SettledPendingTransactionOutcome[]> {
    const settled: SettledPendingTransactionOutcome[] = [];

    for (const group of this.groupByAccount(pending)) {
      const result = await this.checkPendingStatus.execute(
        group.currencyId,
        group.address,
        group.hashes,
      );

      if (result.isLeft()) {
        this.logger.warn("Failed to check pending transactions", {
          error: result.extract(),
          currencyId: group.currencyId,
        });
        continue;
      }

      settled.push(...result.unsafeCoerce());
    }

    return settled;
  }

  private groupByAccount(pending: PendingTransaction[]): {
    currencyId: string;
    address: string;
    hashes: string[];
  }[] {
    const groups = new Map<
      string,
      { currencyId: string; address: string; hashes: string[] }
    >();

    for (const tx of pending) {
      const key = `${tx.ledgerId}:${tx.address}`;
      const group = groups.get(key);
      if (group) {
        group.hashes.push(tx.hash);
      } else {
        groups.set(key, {
          currencyId: tx.ledgerId,
          address: tx.address,
          hashes: [tx.hash],
        });
      }
    }

    return Array.from(groups.values());
  }

  /**
   * Refresh the accounts whose transactions just settled so their balance and
   * history reflect the confirmation.
   */
  private async refreshSettledAccounts(
    settledTxs: PendingTransaction[],
  ): Promise<void> {
    const families = this.resolveSettledFamilies(settledTxs);
    this.logger.debug("Refreshing transaction history after confirmation", {
      families,
    });

    for (const family of families) {
      const result = await this.fetchSelectedAccountUseCase.execute(family);
      if (result.isLeft()) {
        this.logger.warn("Failed to refresh transaction history", {
          error: result.extract(),
          family,
        });
      }
    }
  }

  private resolveSettledFamilies(
    settledTxs: PendingTransaction[],
  ): BlockchainFamily[] {
    const context = this.contextService.getContext();
    const families = new Set<BlockchainFamily>();

    for (const [family, account] of context.selectedAccounts) {
      const isSettledAccount = settledTxs.some(
        (tx) =>
          tx.ledgerId === account.currencyId &&
          tx.address === account.freshAddress,
      );
      if (isSettledAccount) {
        families.add(family);
      }
    }

    // The settled tx no longer maps to a selected account (the user switched
    // account while it was pending): fall back to refreshing the active one.
    if (families.size === 0) {
      const activeFamily = getActiveFamily(context);
      if (activeFamily) {
        families.add(activeFamily);
      }
    }

    return Array.from(families);
  }

  private async emitCurrentState(): Promise<void> {
    await this.emitUpdate();
  }

  private async emitUpdate(): Promise<void> {
    const hydratedTxs =
      await this.hydratePendingTransactionsWithFiatUseCase.execute(
        this.storageService.getAll(),
        this.contextService.getContext().preferredFiatCurrency,
      );
    this.pendingTxSubject.next(hydratedTxs);
  }
}
