import type {
  Account,
  DetailedAccount,
  LedgerButtonCore,
  TransactionHistoryItem,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  buildExplorerTransactionUrl,
  formatBalance,
  getActiveSelectedAccount,
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

export const WINDOW_DURATION_MS = 10 * 60 * 1000;

export class TransactionConfirmationNotifier {
  private subscription: Subscription | undefined;
  private knownPendingHashes = new Set<string>();
  private knownHashes = new Set<string>();
  private windowActive = false;
  private windowTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly core: LedgerButtonCore,
    private readonly notifications: LedgerTransactionNotifications,
    private readonly getI18n: () => TransactionConfirmationI18n,
  ) {}

  start(): void {
    this.stop();

    this.subscription = combineLatest([
      this.core.observePendingTransactions(),
      this.core.observeContext(),
    ]).subscribe(([pending, context]) => {
      const account = getActiveSelectedAccount(context);
      const history = this.isDetailedAccount(account)
        ? (account.transactionHistory ?? [])
        : [];
      const explorerUrlTemplate = this.isDetailedAccount(account)
        ? account.transactionExplorerUrlTemplate
        : undefined;

      const windowWasPreviouslyActive = this.windowActive;
      this.detectAndHandleNewPendingHashes(pending);

      if (windowWasPreviouslyActive) {
        this.flushNewHistoryToasts(history, explorerUrlTemplate);
      }

      this.accumulateKnownHashes(history);
    });
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.clearWindowTimer();
    this.knownPendingHashes = new Set();
    this.knownHashes = new Set();
    this.windowActive = false;
  }

  private detectAndHandleNewPendingHashes(pending: { hash: string }[]): void {
    const hasNewPending = pending.some(
      (tx) => !this.knownPendingHashes.has(this.normalizeHash(tx.hash)),
    );

    for (const tx of pending) {
      this.knownPendingHashes.add(this.normalizeHash(tx.hash));
    }

    if (hasNewPending) {
      this.resetWindowTimer();
    }
  }

  private resetWindowTimer(): void {
    this.clearWindowTimer();
    this.windowActive = true;
    this.windowTimer = setTimeout(() => {
      this.windowActive = false;
      this.windowTimer = null;
    }, WINDOW_DURATION_MS);
  }

  private clearWindowTimer(): void {
    if (this.windowTimer !== null) {
      clearTimeout(this.windowTimer);
      this.windowTimer = null;
    }
  }

  private flushNewHistoryToasts(
    history: TransactionHistoryItem[],
    explorerUrlTemplate: string | undefined,
  ): void {
    const uniqueHashes = [
      ...new Set(history.map((item) => this.normalizeHash(item.hash))),
    ];

    for (const normalizedHash of uniqueHashes) {
      if (this.knownHashes.has(normalizedHash)) {
        continue;
      }

      const items = history.filter(
        (item) => this.normalizeHash(item.hash) === normalizedHash,
      );

      const swapLegs = this.detectSwap(items);
      if (swapLegs) {
        this.pushSwapToast(swapLegs.sentLeg, swapLegs.receivedLeg);
      } else if (items[0]) {
        this.pushToast(items[0], explorerUrlTemplate);
      }
    }
  }

  private accumulateKnownHashes(history: TransactionHistoryItem[]): void {
    for (const item of history) {
      this.knownHashes.add(this.normalizeHash(item.hash));
    }
  }

  private detectSwap(items: TransactionHistoryItem[]): {
    sentLeg: TransactionHistoryItem;
    receivedLeg: TransactionHistoryItem;
  } | null {
    const successful = items.filter((i) => i.status !== "failed");
    const sentLeg = successful.find((i) => i.direction === "sent");
    const receivedLeg = successful.find((i) => i.direction === "received");
    if (
      sentLeg &&
      receivedLeg &&
      sentLeg.asset.ledgerId !== receivedLeg.asset.ledgerId
    ) {
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
