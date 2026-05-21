/**
 * @vitest-environment jsdom
 */
import type {
  DetailedAccount,
  PendingTransaction,
  TransactionHistoryItem,
} from "@ledgerhq/ledger-wallet-provider-core";
import { BehaviorSubject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LedgerTransactionNotifications } from "./ledger-transaction-notifications.js";
import { TransactionConfirmationNotifier } from "./transaction-confirmation-notifier.js";

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
    transactionHistory: [createHistoryItem()],
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

  it("should push a success toast with 'Sent' title for a sent transaction", () => {
    const tx = createPendingTx();
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [
          createHistoryItem({ hash: tx.hash, direction: "sent" }),
        ],
      }),
    });

    expect(notifications.push).toHaveBeenCalledWith({
      variant: "success",
      title: "Sent",
      description: "1 ETH",
    });
  });

  it("should push a success toast with 'Received' title for a received transaction", () => {
    const tx = createPendingTx();
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [
          createHistoryItem({ hash: tx.hash, direction: "received" }),
        ],
      }),
    });

    expect(notifications.push).toHaveBeenCalledWith({
      variant: "success",
      title: "Received",
      description: "1 ETH",
    });
  });

  it("should push a success toast with 'Sent' title for a self-transfer", () => {
    const tx = createPendingTx();
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [
          createHistoryItem({ hash: tx.hash, direction: "self" }),
        ],
      }),
    });

    expect(notifications.push).toHaveBeenCalledWith({
      variant: "success",
      title: "Sent",
      description: "1 ETH",
    });
  });

  it("should push a fail toast with explorer link when history item failed", () => {
    const tx = createPendingTx();
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [
          createHistoryItem({ hash: tx.hash, status: "failed" }),
        ],
        transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
      }),
    });

    expect(notifications.push).toHaveBeenCalledWith({
      variant: "fail",
      title: "Transaction failed",
      linkText: "Check transaction on explorer",
      linkHref: "https://etherscan.io/tx/0xabc",
    });
  });

  it("should push one toast per removed hash when multiple transactions confirm", () => {
    const tx1 = createPendingTx({ hash: "0x1" });
    const tx2 = createPendingTx({ hash: "0x2" });
    notifier.start();

    pendingSubject.next([tx1, tx2]);
    pendingSubject.next([]);
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

  it("should queue removed hashes until history contains them", () => {
    const tx = createPendingTx();
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({ transactionHistory: [] }),
    });

    expect(notifications.push).not.toHaveBeenCalled();

    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [createHistoryItem({ hash: tx.hash })],
      }),
    });

    expect(notifications.push).toHaveBeenCalledTimes(1);
  });

  it("should match history items when pending and history hashes differ only by case", () => {
    const tx = createPendingTx({ hash: "0xAbCdEf" });
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [createHistoryItem({ hash: "0xabcdef" })],
      }),
    });

    expect(notifications.push).toHaveBeenCalledTimes(1);
  });

  it("should not push duplicate toasts when context re-emits with the same history", () => {
    const tx = createPendingTx();
    const account = createDetailedAccount({
      transactionHistory: [createHistoryItem({ hash: tx.hash })],
    });
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({ selectedAccount: account });
    contextSubject.next({ selectedAccount: account });

    expect(notifications.push).toHaveBeenCalledTimes(1);
  });

  it("should stop subscribing when stop is called", () => {
    const tx = createPendingTx();
    notifier.start();
    notifier.stop();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [createHistoryItem({ hash: tx.hash })],
      }),
    });

    expect(notifications.push).not.toHaveBeenCalled();
  });

  it("should push a swap toast when two history items share the same hash with different assets", () => {
    const tx = createPendingTx({ hash: "0xswap" });
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [
          createHistoryItem({
            hash: tx.hash,
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
            hash: tx.hash,
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

  it("should not treat two history items with the same asset as a swap", () => {
    const tx = createPendingTx({ hash: "0xnotswap" });
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [
          createHistoryItem({
            hash: tx.hash,
            direction: "sent",
            asset: {
              ledgerId: "ethereum",
              name: "Ethereum",
              ticker: "ETH",
              decimals: 18,
            },
          }),
          createHistoryItem({
            hash: tx.hash,
            direction: "received",
            asset: {
              ledgerId: "ethereum",
              name: "Ethereum",
              ticker: "ETH",
              decimals: 18,
            },
          }),
        ],
      }),
    });

    expect(notifications.push).toHaveBeenCalledTimes(1);
    expect(notifications.push).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success", title: "Sent" }),
    );
  });

  it("should push a fail toast when swap legs are failed", () => {
    const tx = createPendingTx({ hash: "0xfailedswap" });
    notifier.start();

    pendingSubject.next([tx]);
    pendingSubject.next([]);
    contextSubject.next({
      selectedAccount: createDetailedAccount({
        transactionHistory: [
          createHistoryItem({
            hash: tx.hash,
            direction: "sent",
            status: "failed",
            asset: {
              ledgerId: "ethereum/erc20/usd_coin",
              name: "USD Coin",
              ticker: "USDC",
              decimals: 6,
            },
          }),
          createHistoryItem({
            hash: tx.hash,
            direction: "received",
            status: "failed",
            asset: {
              ledgerId: "ethereum/erc20/tether",
              name: "Tether USD",
              ticker: "USDT",
              decimals: 6,
            },
          }),
        ],
        transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
      }),
    });

    expect(notifications.push).toHaveBeenCalledTimes(1);
    expect(notifications.push).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "fail", title: "Transaction failed" }),
    );
  });
});
