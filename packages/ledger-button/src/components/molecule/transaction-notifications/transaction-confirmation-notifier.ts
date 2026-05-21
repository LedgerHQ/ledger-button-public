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
  transactionSentTitle: string;
  transactionReceivedTitle: string;
  transactionFailedTitle: string;
  transactionSwapTitle: string;
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

      const items = this.findHistoryItems(history, hash);
      if (items.length === 0) {
        continue;
      }

      const swapLegs = this.detectSwap(items);
      if (swapLegs) {
        this.pushSwapToast(swapLegs.sentLeg, swapLegs.receivedLeg);
      } else {
        this.pushToast(items[0], explorerUrlTemplate);
      }

      this.shownHashes.add(normalizedHash);
      this.pendingConfirmationHashes.delete(hash);
    }
  }

  private findHistoryItems(
    history: TransactionHistoryItem[],
    hash: string,
  ): TransactionHistoryItem[] {
    const normalizedHash = this.normalizeHash(hash);
    return history.filter(
      (item) => this.normalizeHash(item.hash) === normalizedHash,
    );
  }

  private detectSwap(
    items: TransactionHistoryItem[],
  ): { sentLeg: TransactionHistoryItem; receivedLeg: TransactionHistoryItem } | null {
    const successful = items.filter((i) => i.status !== "failed");
    const sentLeg = successful.find((i) => i.direction === "sent");
    const receivedLeg = successful.find((i) => i.direction === "received");
    if (sentLeg && receivedLeg && sentLeg.asset.ledgerId !== receivedLeg.asset.ledgerId) {
      return { sentLeg, receivedLeg };
    }
    return null;
  }

  private normalizeHash(hash: string): string {
    return hash.toLowerCase();
  }

  private pushSwapToast(
    sentLeg: TransactionHistoryItem,
    receivedLeg: TransactionHistoryItem,
  ): void {
    const i18n = this.getI18n();
    const sentFormatted = formatBalance(
      sentLeg.value,
      sentLeg.asset.decimals,
      sentLeg.asset.ticker,
    );
    const receivedFormatted = formatBalance(
      receivedLeg.value,
      receivedLeg.asset.decimals,
      receivedLeg.asset.ticker,
    );
    this.notifications.push({
      variant: "success",
      title: i18n.transactionSwapTitle,
      description:
        `${sentFormatted} ${sentLeg.asset.ticker} → ${receivedFormatted} ${receivedLeg.asset.ticker}`.trim(),
    });
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

    const title =
      tx.direction === "received"
        ? i18n.transactionReceivedTitle
        : i18n.transactionSentTitle;

    this.notifications.push({
      variant: "success",
      title,
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
