/**
 * @vitest-environment jsdom
 */
import type {
  DetailedAccount,
  PendingTransaction,
  TransactionHistoryItem,
} from "@ledgerhq/ledger-wallet-provider-core";
import { BehaviorSubject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LedgerTransactionNotifications } from "./ledger-transaction-notifications.js";
import {
  TransactionConfirmationNotifier,
  WINDOW_DURATION_MS,
} from "./transaction-confirmation-notifier.js";

function createPendingTx(
  overrides: Partial<PendingTransaction> = {},
): PendingTransaction {
  return {
    hash: "0xabc",
    chainId: 1,
    address: "0x1234",
    timestamp: "2026-03-16T10:00:00.000Z",
    type: "sent",
    value: "1000000000000000000",
    formattedValue: "1",
    ticker: "ETH",
    currencyName: "Ethereum",
    ledgerId: "ethereum",
    ...overrides,
  };
}

function createHistoryItem(
  overrides: Partial<TransactionHistoryItem> = {},
): TransactionHistoryItem {
  return {
    hash: "0xabc",
    type: "sent",
    direction: "sent",
    kind: "transfer",
    status: "confirmed",
    value: "1000000000000000000",
    asset: {
      ledgerId: "ethereum",
      name: "Ethereum",
      ticker: "ETH",
      decimals: 18,
    },
    timestamp: "2026-03-16T10:00:00.000Z",
    ...overrides,
  };
}

function createDetailedAccount(
  overrides: Partial<DetailedAccount> = {},
): DetailedAccount {
  return {
    id: "acc-1",
    freshAddress: "0x1234",
    currencyId: "ethereum",
    ticker: "ETH",
    name: "Ethereum",
    balance: "0",
    transactionHistory: [],
    transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
    ...overrides,
  } as DetailedAccount;
}

describe("TransactionConfirmationNotifier", () => {
  let pendingSubject: BehaviorSubject<PendingTransaction[]>;
  let contextSubject: BehaviorSubject<{
    selectedAccount: DetailedAccount | undefined;
  }>;
  let notifications: LedgerTransactionNotifications;
  let notifier: TransactionConfirmationNotifier;

  beforeEach(() => {
    vi.useFakeTimers();

    pendingSubject = new BehaviorSubject<PendingTransaction[]>([]);
    contextSubject = new BehaviorSubject<{
      selectedAccount: DetailedAccount | undefined;
    }>({
      selectedAccount: createDetailedAccount({ transactionHistory: [] }),
    });

    notifications = {
      push: vi.fn().mockReturnValue("toast-id"),
    } as unknown as LedgerTransactionNotifications;

    const core = {
      observePendingTransactions: vi
        .fn()
        .mockReturnValue(pendingSubject.asObservable()),
      observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
    };

    notifier = new TransactionConfirmationNotifier(
      core as never,
      notifications,
      () => ({
        transactionSentTitle: "Sent",
        transactionReceivedTitle: "Received",
        transactionFailedTitle: "Transaction failed",
        transactionSwapTitle: "Transaction confirmed",
        checkOnExplorer: "Check transaction on explorer",
      }),
    );
  });

  afterEach(() => {
    notifier.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("window activation", () => {
    it("does not show a toast when no pending transaction has been seen", () => {
      notifier.start();

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xnew" })],
        }),
      });

      expect(notifications.push).not.toHaveBeenCalled();
    });

    it("opens the window when a new pending transaction appears", () => {
      notifier.start();

      pendingSubject.next([createPendingTx({ hash: "0x1" })]);
      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xnew" })],
        }),
      });

      expect(notifications.push).toHaveBeenCalledTimes(1);
    });

    it("does not show a toast after the 10-minute window expires", () => {
      notifier.start();

      pendingSubject.next([createPendingTx({ hash: "0x1" })]);

      vi.advanceTimersByTime(WINDOW_DURATION_MS);

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xnew" })],
        }),
      });

      expect(notifications.push).not.toHaveBeenCalled();
    });

    it("resets the 10-minute window when a second pending transaction appears", () => {
      notifier.start();

      pendingSubject.next([createPendingTx({ hash: "0x1" })]);

      vi.advanceTimersByTime(WINDOW_DURATION_MS - 1000);

      pendingSubject.next([
        createPendingTx({ hash: "0x1" }),
        createPendingTx({ hash: "0x2" }),
      ]);

      vi.advanceTimersByTime(WINDOW_DURATION_MS - 1000);

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xnew" })],
        }),
      });

      expect(notifications.push).toHaveBeenCalledTimes(1);
    });

    it("closes the window after the reset 10 minutes also expire", () => {
      notifier.start();

      pendingSubject.next([createPendingTx({ hash: "0x1" })]);

      vi.advanceTimersByTime(WINDOW_DURATION_MS - 1000);

      pendingSubject.next([
        createPendingTx({ hash: "0x1" }),
        createPendingTx({ hash: "0x2" }),
      ]);

      vi.advanceTimersByTime(WINDOW_DURATION_MS);

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xnew" })],
        }),
      });

      expect(notifications.push).not.toHaveBeenCalled();
    });
  });

  describe("initial history snapshot", () => {
    it("does not toast for transactions that existed before start()", () => {
      contextSubject = new BehaviorSubject({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xpre" })],
        }),
      });

      const core = {
        observePendingTransactions: vi
          .fn()
          .mockReturnValue(pendingSubject.asObservable()),
        observeContext: vi
          .fn()
          .mockReturnValue(contextSubject.asObservable()),
      };

      notifier = new TransactionConfirmationNotifier(
        core as never,
        notifications,
        () => ({
          transactionSentTitle: "Sent",
          transactionReceivedTitle: "Received",
          transactionFailedTitle: "Transaction failed",
          transactionSwapTitle: "Transaction confirmed",
          checkOnExplorer: "Check transaction on explorer",
        }),
      );

      notifier.start();

      pendingSubject.next([createPendingTx({ hash: "0x1" })]);

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xpre" })],
        }),
      });

      expect(notifications.push).not.toHaveBeenCalled();
    });

    it("does not toast for history items that loaded after start() but before the window opens", () => {
      notifier.start();

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [
            createHistoryItem({ hash: "0xpre1" }),
            createHistoryItem({ hash: "0xpre2" }),
          ],
        }),
      });

      pendingSubject.next([createPendingTx({ hash: "0x1" })]);

      expect(notifications.push).not.toHaveBeenCalled();
    });
  });

  describe("toast content", () => {
    beforeEach(() => {
      notifier.start();
      pendingSubject.next([createPendingTx({ hash: "0x1" })]);
    });

    it("pushes a success toast with 'Sent' title for a sent transaction", () => {
      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [
            createHistoryItem({ hash: "0xnew", direction: "sent" }),
          ],
        }),
      });

      expect(notifications.push).toHaveBeenCalledWith({
        variant: "success",
        title: "Sent",
        description: "1 ETH",
      });
    });

    it("pushes a success toast with 'Received' title for a received transaction", () => {
      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [
            createHistoryItem({ hash: "0xnew", direction: "received" }),
          ],
        }),
      });

      expect(notifications.push).toHaveBeenCalledWith({
        variant: "success",
        title: "Received",
        description: "1 ETH",
      });
    });

    it("pushes a success toast with 'Sent' title for a self-transfer", () => {
      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [
            createHistoryItem({ hash: "0xnew", direction: "self" }),
          ],
        }),
      });

      expect(notifications.push).toHaveBeenCalledWith({
        variant: "success",
        title: "Sent",
        description: "1 ETH",
      });
    });

    it("pushes a fail toast with explorer link for a failed transaction", () => {
      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [
            createHistoryItem({ hash: "0xnew", status: "failed" }),
          ],
          transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
        }),
      });

      expect(notifications.push).toHaveBeenCalledWith({
        variant: "fail",
        title: "Transaction failed",
        linkText: "Check transaction on explorer",
        linkHref: "https://etherscan.io/tx/0xnew",
      });
    });

    it("pushes a swap toast when two history items share the same hash with different assets", () => {
      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [
            createHistoryItem({
              hash: "0xswap",
              direction: "sent",
              asset: {
                ledgerId: "ethereum/erc20/usd_coin",
                name: "USD Coin",
                ticker: "USDC",
                decimals: 6,
              },
              value: "100000000",
            }),
            createHistoryItem({
              hash: "0xswap",
              direction: "received",
              asset: {
                ledgerId: "ethereum/erc20/tether",
                name: "Tether USD",
                ticker: "USDT",
                decimals: 6,
              },
              value: "99500000",
            }),
          ],
        }),
      });

      expect(notifications.push).toHaveBeenCalledTimes(1);
      expect(notifications.push).toHaveBeenCalledWith({
        variant: "success",
        title: "Transaction confirmed",
        description: "100 USDC → 99.5 USDT",
      });
    });

    it("does not treat two items with the same asset as a swap", () => {
      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [
            createHistoryItem({
              hash: "0xnotswap",
              direction: "sent",
            }),
            createHistoryItem({
              hash: "0xnotswap",
              direction: "received",
            }),
          ],
        }),
      });

      expect(notifications.push).toHaveBeenCalledTimes(1);
      expect(notifications.push).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "success", title: "Sent" }),
      );
    });

    it("pushes one toast per unique hash when multiple transactions appear", () => {
      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [
            createHistoryItem({ hash: "0x1" }),
            createHistoryItem({ hash: "0x2", status: "failed" }),
          ],
        }),
      });

      expect(notifications.push).toHaveBeenCalledTimes(2);
    });
  });

  describe("deduplication", () => {
    it("does not push duplicate toasts when context re-emits the same history", () => {
      notifier.start();
      pendingSubject.next([createPendingTx({ hash: "0x1" })]);

      const account = createDetailedAccount({
        transactionHistory: [createHistoryItem({ hash: "0xnew" })],
      });

      contextSubject.next({ selectedAccount: account });
      contextSubject.next({ selectedAccount: account });

      expect(notifications.push).toHaveBeenCalledTimes(1);
    });

    it("matches history hashes case-insensitively", () => {
      notifier.start();
      pendingSubject.next([createPendingTx({ hash: "0x1" })]);

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xAbCdEf" })],
        }),
      });
      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xabcdef" })],
        }),
      });

      expect(notifications.push).toHaveBeenCalledTimes(1);
    });
  });

  describe("lifecycle", () => {
    it("does not push toasts after stop() is called", () => {
      notifier.start();
      pendingSubject.next([createPendingTx({ hash: "0x1" })]);
      notifier.stop();

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xnew" })],
        }),
      });

      expect(notifications.push).not.toHaveBeenCalled();
    });

    it("clears the window timer on stop()", () => {
      notifier.start();
      pendingSubject.next([createPendingTx({ hash: "0x1" })]);
      notifier.stop();

      vi.advanceTimersByTime(WINDOW_DURATION_MS);

      expect(notifications.push).not.toHaveBeenCalled();
    });

    it("resets state on a second start() call", () => {
      notifier.start();
      pendingSubject.next([createPendingTx({ hash: "0x1" })]);

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xfirst" })],
        }),
      });

      expect(notifications.push).toHaveBeenCalledTimes(1);

      notifier.stop();
      notifier.start();

      pendingSubject.next([createPendingTx({ hash: "0x2" })]);

      contextSubject.next({
        selectedAccount: createDetailedAccount({
          transactionHistory: [createHistoryItem({ hash: "0xsecond" })],
        }),
      });

      expect(notifications.push).toHaveBeenCalledTimes(2);
    });
  });
});
