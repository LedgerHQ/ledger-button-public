import type {
  DetailedAccount,
  PendingTransaction,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { BehaviorSubject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreContext } from "../../context/core-context.js";
import type { LanguageContext } from "../../context/language-context.js";
import type { Navigation } from "../../shared/navigation.js";
import type { Destinations } from "../../shared/routes.js";
import { LedgerHomeController } from "./ledger-home-controller.js";

function mockRight<T>(value: T) {
  return {
    caseOf: (handlers: { Right: (v: T) => void }) => handlers.Right(value),
    isRight: () => true,
    isLeft: () => false,
    extract: () => value,
  };
}

function createDetailedAccount(
  overrides: Partial<DetailedAccount> = {},
): DetailedAccount {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0xabc123",
    seedIdentifier: "seed-1",
    derivationMode: "",
    index: 0,
    name: "Ethereum",
    ticker: "ETH",
    balance: "1.5",
    tokens: [],
    fiatBalance: { value: "3000.00", currency: "USD" },
    totalFiatValue: "3000.00",
    transactionHistory: [],
    networks: [{ id: "ethereum", name: "Ethereum", ticker: "ETH" }],
    ...overrides,
  } as DetailedAccount;
}

function createPendingTx(
  overrides: Partial<PendingTransaction> = {},
): PendingTransaction {
  return {
    hash: "0xpending1",
    chainId: 1,
    address: "0xabc123",
    timestamp: "2026-04-08T10:00:00.000Z",
    type: "sent",
    value: "1000000000000000000",
    formattedValue: "1 ETH",
    ticker: "ETH",
    currencyName: "Ethereum",
    ledgerId: "ethereum",
    ...overrides,
  };
}

describe("LedgerHomeController", () => {
  let controller: LedgerHomeController;
  let host: ReactiveControllerHost;
  let core: CoreContext;
  let navigation: Navigation;
  let destinations: Destinations;
  let languages: LanguageContext;
  let pendingTxSubject: BehaviorSubject<PendingTransaction[]>;
  let contextSubject: BehaviorSubject<Record<string, unknown>>;
  const account = createDetailedAccount();

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    pendingTxSubject = new BehaviorSubject<PendingTransaction[]>([]);
    contextSubject = new BehaviorSubject<Record<string, unknown>>({
      selectedAccount: {
        freshAddress: "0xabc123",
        currencyId: "ethereum",
      },
      preferredFiatCurrency: "usd",
    });

    core = {
      observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
      observePendingTransactions: vi
        .fn()
        .mockReturnValue(pendingTxSubject.asObservable()),
      getDetailedSelectedAccount: vi.fn().mockResolvedValue(mockRight(account)),
    } as unknown as CoreContext;

    navigation = {
      navigateTo: vi.fn(),
      navigateBack: vi.fn(),
      host: {},
    } as unknown as Navigation;

    destinations = {
      onboardingFlow: { name: "onboarding-flow" },
    } as unknown as Destinations;

    languages = {
      currentTranslation: {
        accountTokens: { unknownToken: "Unknown Token" },
      },
    } as unknown as LanguageContext;

    controller = new LedgerHomeController(
      host,
      core,
      navigation,
      destinations,
      languages,
    );
  });

  async function connectAndWaitForLoad() {
    controller.hostConnected();
    await vi.waitFor(() => {
      expect(core.getDetailedSelectedAccount).toHaveBeenCalled();
    });
    (core.getDetailedSelectedAccount as ReturnType<typeof vi.fn>).mockClear();
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();
  }

  describe("preferredCurrency", () => {
    it("returns the uppercased currency emitted by context", async () => {
      await connectAndWaitForLoad();

      contextSubject.next({
        selectedAccount: { freshAddress: "0xabc123", currencyId: "ethereum" },
        preferredFiatCurrency: "eur",
      });

      expect(controller.preferredCurrency).toBe("EUR");
    });

    it("calls getSelectedAccount when preferredFiatCurrency changes", async () => {
      await connectAndWaitForLoad();

      contextSubject.next({
        selectedAccount: { freshAddress: "0xabc123", currencyId: "ethereum" },
        preferredFiatCurrency: "usd",
      });
      (core.getDetailedSelectedAccount as ReturnType<typeof vi.fn>).mockClear();

      contextSubject.next({
        selectedAccount: { freshAddress: "0xabc123", currencyId: "ethereum" },
        preferredFiatCurrency: "eur",
      });

      await vi.waitFor(() => {
        expect(core.getDetailedSelectedAccount).toHaveBeenCalled();
      });
    });

    it("does not call getSelectedAccount when preferredFiatCurrency stays the same", async () => {
      await connectAndWaitForLoad();

      contextSubject.next({
        selectedAccount: { freshAddress: "0xabc123", currencyId: "ethereum" },
        preferredFiatCurrency: "usd",
      });
      (core.getDetailedSelectedAccount as ReturnType<typeof vi.fn>).mockClear();

      contextSubject.next({
        selectedAccount: { freshAddress: "0xabc123", currencyId: "ethereum" },
        preferredFiatCurrency: "usd",
      });

      expect(core.getDetailedSelectedAccount).not.toHaveBeenCalled();
    });
  });

  describe("context-driven account updates", () => {
    it("should update selectedAccount when context emits a DetailedAccount with transactionHistory", async () => {
      const freshAccount = createDetailedAccount({
        transactionHistory: [
          {
            hash: "0x111",
            type: "sent",
            direction: "sent",
            kind: "transfer",
            status: "confirmed",
            timestamp: "2026-04-08T10:00:00.000Z",
            value: "1000000000000000000",
            asset: {
              ledgerId: "ethereum",
              name: "Ethereum",
              ticker: "ETH",
              decimals: 18,
            },
          },
        ] as DetailedAccount["transactionHistory"],
      });

      await connectAndWaitForLoad();

      contextSubject.next({
        selectedAccount: freshAccount,
        preferredFiatCurrency: "usd",
      });

      expect(controller.selectedAccount).toEqual(freshAccount);
      expect(controller.transactionListItems).toHaveLength(1);
      expect(host.requestUpdate).toHaveBeenCalled();
    });

    it("should call getSelectedAccount when address changes", async () => {
      await connectAndWaitForLoad();

      contextSubject.next({
        selectedAccount: {
          freshAddress: "0xdifferent",
          currencyId: "ethereum",
        },
        preferredFiatCurrency: "usd",
      });

      await vi.waitFor(() => {
        expect(core.getDetailedSelectedAccount).toHaveBeenCalled();
      });
    });

    it("should call getSelectedAccount when currencyId changes", async () => {
      await connectAndWaitForLoad();

      contextSubject.next({
        selectedAccount: {
          freshAddress: "0xabc123",
          currencyId: "polygon",
        },
        preferredFiatCurrency: "usd",
      });

      await vi.waitFor(() => {
        expect(core.getDetailedSelectedAccount).toHaveBeenCalled();
      });
    });

    it("should not call getSelectedAccount when context emits same address and currencyId", async () => {
      await connectAndWaitForLoad();

      contextSubject.next({
        selectedAccount: {
          freshAddress: "0xabc123",
          currencyId: "ethereum",
        },
        preferredFiatCurrency: "usd",
      });

      expect(core.getDetailedSelectedAccount).not.toHaveBeenCalled();
    });
  });

  describe("pending transactions", () => {
    it("should update pendingTransactionListItems when pending transactions change", () => {
      const tx1 = createPendingTx({ hash: "0x111" });

      controller.hostConnected();
      pendingTxSubject.next([tx1]);

      expect(controller.pendingTransactionListItems).toHaveLength(1);
      expect(host.requestUpdate).toHaveBeenCalled();
    });

    it("should clear pending list when all are confirmed", () => {
      const tx1 = createPendingTx({ hash: "0x111" });

      controller.hostConnected();
      pendingTxSubject.next([tx1]);
      expect(controller.pendingTransactionListItems).toHaveLength(1);

      pendingTxSubject.next([]);
      expect(controller.pendingTransactionListItems).toHaveLength(0);
    });
  });

  describe("explorer URLs", () => {
    it("should build explorerUrl from the account's per-currency template", async () => {
      const accountWithExplorerUrl = createDetailedAccount({
        transactionHistory: [
          {
            hash: "0xabc",
            type: "sent",
            direction: "sent",
            kind: "transfer",
            status: "confirmed",
            timestamp: "2026-04-08T10:00:00.000Z",
            value: "1000000000000000000",
            asset: {
              ledgerId: "ethereum",
              name: "Ethereum",
              ticker: "ETH",
              decimals: 18,
            },
          },
        ] as DetailedAccount["transactionHistory"],
        transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
      });

      controller.hostConnected();
      await vi.waitFor(() => {
        expect(core.getDetailedSelectedAccount).toHaveBeenCalled();
      });
      contextSubject.next({
        selectedAccount: accountWithExplorerUrl,
        preferredFiatCurrency: "usd",
      });

      expect(controller.transactionListItems[0]?.explorerUrl).toBe(
        "https://etherscan.io/tx/0xabc",
      );
    });

    it("should propagate explorerUrl from pending transactions to the list row", () => {
      const tx = createPendingTx({
        hash: "0xpending1",
        explorerUrl: "https://etherscan.io/tx/0xpending1",
      });

      controller.hostConnected();
      pendingTxSubject.next([tx]);

      expect(controller.pendingTransactionListItems[0]?.explorerUrl).toBe(
        "https://etherscan.io/tx/0xpending1",
      );
    });

    it("should leave explorerUrl undefined when upstream did not provide one", () => {
      const tx = createPendingTx({ hash: "0xnoexplorer" });

      controller.hostConnected();
      pendingTxSubject.next([tx]);

      expect(
        controller.pendingTransactionListItems[0]?.explorerUrl,
      ).toBeUndefined();
    });
  });
});
