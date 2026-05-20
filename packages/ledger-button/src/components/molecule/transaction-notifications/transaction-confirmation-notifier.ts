import type {
  Account,
  DetailedAccount,
  LedgerButtonCore,
  TransactionHistoryItem,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  buildExplorerTransactionUrl,
  formatBalance,
} from "@ledgerhq/ledger-wallet-provider-core";
import { combineLatest, Subscription } from "rxjs";

import type { LedgerTransactionNotifications } from "./ledger-transaction-notifications.js";

export type TransactionConfirmationI18n = {
  transactionConfirmedTitle: string;
  transactionFailedTitle: string;
  checkOnExplorer: string;
};

export class TransactionConfirmationNotifier {
  private subscription: Subscription | undefined;
  private previousPendingHashes = new Set<string>();
  private pendingConfirmationHashes = new Set<string>();
  private shownHashes = new Set<string>();

  constructor(
    private readonly core: LedgerButtonCore,
    private readonly notifications: LedgerTransactionNotifications,
    private readonly getI18n: () => TransactionConfirmationI18n,
  ) {}

  start(): void {
    this.stop();
    this.previousPendingHashes = new Set();
    this.pendingConfirmationHashes = new Set();
    this.shownHashes = new Set();

    this.subscription = combineLatest([
      this.core.observePendingTransactions(),
      this.core.observeContext(),
    ]).subscribe(([pending, context]) => {
      this.trackRemovedPendingHashes(pending);

      if (this.pendingConfirmationHashes.size === 0) {
        return;
      }

      const account = context.selectedAccount;
      if (!this.isDetailedAccount(account) || !account.transactionHistory) {
        return;
      }

      this.flushPendingToasts(
        account.transactionHistory,
        account.transactionExplorerUrlTemplate,
      );
    });
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.previousPendingHashes = new Set();
    this.pendingConfirmationHashes = new Set();
    this.shownHashes = new Set();
  }

  private trackRemovedPendingHashes(pending: { hash: string }[]): void {
    const currentHashes = new Set(
      pending.map((tx) => this.normalizeHash(tx.hash)),
    );

    if (this.previousPendingHashes.size > 0) {
      for (const hash of this.previousPendingHashes) {
        if (!currentHashes.has(this.normalizeHash(hash))) {
          this.pendingConfirmationHashes.add(hash);
        }
      }
    }

    this.previousPendingHashes = new Set(pending.map((tx) => tx.hash));
  }

  private flushPendingToasts(
    history: TransactionHistoryItem[],
    explorerUrlTemplate: string | undefined,
  ): void {
    for (const hash of [...this.pendingConfirmationHashes]) {
      const normalizedHash = this.normalizeHash(hash);

      if (this.shownHashes.has(normalizedHash)) {
        this.pendingConfirmationHashes.delete(hash);
        continue;
      }

      const tx = this.findHistoryItem(history, hash);
      if (!tx) {
        continue;
      }

      this.pushToast(tx, explorerUrlTemplate);
      this.shownHashes.add(normalizedHash);
      this.pendingConfirmationHashes.delete(hash);
    }
  }

  private findHistoryItem(
    history: TransactionHistoryItem[],
    hash: string,
  ): TransactionHistoryItem | undefined {
    const normalizedHash = this.normalizeHash(hash);
    return history.find(
      (item) => this.normalizeHash(item.hash) === normalizedHash,
    );
  }

  private normalizeHash(hash: string): string {
    return hash.toLowerCase();
  }

  private pushToast(
    tx: TransactionHistoryItem,
    explorerUrlTemplate: string | undefined,
  ): void {
    const i18n = this.getI18n();

    if (tx.status === "failed") {
      const explorerUrl = buildExplorerTransactionUrl(
        explorerUrlTemplate,
        tx.hash,
      );
      this.notifications.push({
        variant: "fail",
        title: i18n.transactionFailedTitle,
        ...(explorerUrl
          ? {
              linkText: i18n.checkOnExplorer,
              linkHref: explorerUrl,
            }
          : {}),
      });
      return;
    }

    const formattedValue = formatBalance(
      tx.value,
      tx.asset.decimals,
      tx.asset.ticker,
    );

    this.notifications.push({
      variant: "success",
      title: i18n.transactionConfirmedTitle,
      description: `${formattedValue} ${tx.asset.ticker}`.trim(),
    });
  }

  private isDetailedAccount(
    account: Account | undefined,
  ): account is DetailedAccount {
    return (
      !!account &&
      typeof account === "object" &&
      "transactionHistory" in account
    );
  }
}
