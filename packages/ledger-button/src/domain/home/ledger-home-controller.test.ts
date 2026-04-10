import type {
  DetailedAccount,
  PendingTransaction,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { BehaviorSubject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreContext } from "../../context/core-context.js";
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
    });

    core = {
      observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
      observePendingTransactions: vi
        .fn()
        .mockReturnValue(pendingTxSubject.asObservable()),
      getDetailedSelectedAccount: vi
        .fn()
        .mockResolvedValue(mockRight(account)),
    } as unknown as CoreContext;

    navigation = {
      navigateTo: vi.fn(),
      navigateBack: vi.fn(),
      host: {},
    } as unknown as Navigation;

    destinations = {
      onboardingFlow: { name: "onboarding-flow" },
    } as unknown as Destinations;

    controller = new LedgerHomeController(
      host,
      core,
      navigation,
      destinations,
    );
  });

  describe("context-driven account updates", () => {
    async function connectAndWaitForLoad() {
      controller.hostConnected();
      await vi.waitFor(() => {
        expect(core.getDetailedSelectedAccount).toHaveBeenCalled();
      });
      (core.getDetailedSelectedAccount as ReturnType<typeof vi.fn>).mockClear();
      (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();
    }

    it("should update selectedAccount when context emits a DetailedAccount with transactionHistory", async () => {
      const freshAccount = createDetailedAccount({
        transactionHistory: [
          {
            hash: "0x111",
            type: "sent",
            timestamp: "2026-04-08T10:00:00.000Z",
            formattedValue: "1 ETH",
            ticker: "ETH",
            currencyName: "Ethereum",
          },
        ] as DetailedAccount["transactionHistory"],
      });

      await connectAndWaitForLoad();

      contextSubject.next({
        selectedAccount: freshAccount,
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
});
