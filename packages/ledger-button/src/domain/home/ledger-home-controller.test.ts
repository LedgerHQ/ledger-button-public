import type {
  Account,
  BlockchainFamily,
  ButtonCoreContext,
  DetailedAccount,
  PendingTransaction,
} from "@ledgerhq/ledger-wallet-provider-core";
import { DEFAULT_BLOCKCHAIN_FAMILY } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { BehaviorSubject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreContext } from "../../context/core-context.js";
import type { LanguageContext } from "../../context/language-context.js";
import { LedgerHomeController } from "./ledger-home-controller.js";

function createAccount(overrides: Partial<Account> = {}): Account {
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
    ...overrides,
  };
}

function createContext(
  overrides: Partial<ButtonCoreContext> = {},
): ButtonCoreContext {
  return {
    connectedDevice: undefined,
    selectedAccounts: new Map<BlockchainFamily, Account>([
      [DEFAULT_BLOCKCHAIN_FAMILY, createAccount()],
    ]),
    activeFamily: DEFAULT_BLOCKCHAIN_FAMILY,
    trustChainId: undefined,
    applicationPath: undefined,
    chainId: 1,
    welcomeScreenCompleted: true,
    hasTrackingConsent: undefined,
    isMobilePlatform: false,
    preferredFiatCurrency: "usd",
    ...overrides,
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
  let languages: LanguageContext;
  let fetchSelectedAccount: ReturnType<typeof vi.fn>;
  let pendingTxSubject: BehaviorSubject<PendingTransaction[]>;
  let contextSubject: BehaviorSubject<ButtonCoreContext>;
  const account = createDetailedAccount();

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    pendingTxSubject = new BehaviorSubject<PendingTransaction[]>([]);
    contextSubject = new BehaviorSubject<ButtonCoreContext>(createContext());
    fetchSelectedAccount = vi.fn().mockResolvedValue(account);

    core = {
      observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
      fetchSelectedAccount,
      observePendingTransactions: vi
        .fn()
        .mockReturnValue(pendingTxSubject.asObservable()),
    } as unknown as CoreContext;

    languages = {
      currentTranslation: {
        accountTokens: { unknownToken: "Unknown Token" },
      },
    } as unknown as LanguageContext;

    controller = new LedgerHomeController(host, core, languages);
  });

  async function connectAndWaitForLoad() {
    controller.hostConnected();
    await vi.waitFor(() => {
      expect(controller.loading).toBe(false);
    });
    (host.requestUpdate as ReturnType<typeof vi.fn>).mockClear();
  }

  describe("preferredCurrency", () => {
    it("returns the uppercased currency emitted by context", async () => {
      await connectAndWaitForLoad();

      contextSubject.next(createContext({ preferredFiatCurrency: "eur" }));

      expect(controller.preferredCurrency).toBe("EUR");
    });

    it("updates when preferredFiatCurrency changes", async () => {
      await connectAndWaitForLoad();

      contextSubject.next(createContext({ preferredFiatCurrency: "eur" }));
      expect(controller.preferredCurrency).toBe("EUR");

      contextSubject.next(createContext({ preferredFiatCurrency: "gbp" }));
      expect(controller.preferredCurrency).toBe("GBP");
    });

    it("calls requestUpdate when preferredFiatCurrency changes", async () => {
      await connectAndWaitForLoad();

      contextSubject.next(createContext({ preferredFiatCurrency: "eur" }));

      expect(host.requestUpdate).toHaveBeenCalled();
    });
  });

  describe("account updates", () => {
    it("sets selectedAccount from the context's selected account", async () => {
      controller.hostConnected();

      await vi.waitFor(() => {
        expect(controller.selectedAccount).toEqual(account);
      });
      expect(fetchSelectedAccount).toHaveBeenCalledWith(
        DEFAULT_BLOCKCHAIN_FAMILY,
      );
    });

    it("sets loading to false when first account arrives", async () => {
      controller.hostConnected();
      expect(controller.loading).toBe(true);

      await vi.waitFor(() => {
        expect(controller.loading).toBe(false);
        expect(controller.selectedAccount).toEqual(account);
      });
    });

    it("sets selectedAccount to undefined when no account is selected", async () => {
      await connectAndWaitForLoad();

      contextSubject.next(
        createContext({
          selectedAccounts: new Map<BlockchainFamily, Account>(),
        }),
      );

      await vi.waitFor(() => {
        expect(controller.selectedAccount).toBeUndefined();
      });
    });

    it("updates selectedAccount when a new account is selected", async () => {
      await connectAndWaitForLoad();

      const newAccount = createDetailedAccount({ freshAddress: "0xdef456" });
      fetchSelectedAccount.mockResolvedValue(newAccount);
      contextSubject.next(
        createContext({
          selectedAccounts: new Map<BlockchainFamily, Account>([
            [
              DEFAULT_BLOCKCHAIN_FAMILY,
              createAccount({ freshAddress: "0xdef456" }),
            ],
          ]),
        }),
      );

      await vi.waitFor(() => {
        expect(controller.selectedAccount?.freshAddress).toBe("0xdef456");
      });
    });

    it("calls requestUpdate when account arrives", async () => {
      controller.hostConnected();

      await vi.waitFor(() => {
        expect(host.requestUpdate).toHaveBeenCalled();
      });
    });
  });

  describe("context-driven account updates", () => {
    it("should update selectedAccount with transactionHistory", async () => {
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
      fetchSelectedAccount.mockResolvedValue(freshAccount);

      controller.hostConnected();

      await vi.waitFor(() => {
        expect(controller.selectedAccount).toEqual(freshAccount);
      });
      expect(controller.transactionListItems).toHaveLength(1);
      expect(host.requestUpdate).toHaveBeenCalled();
    });
  });

  describe("pending transactions", () => {
    it("should update pendingTransactionListItems when pending transactions change", async () => {
      const tx1 = createPendingTx({ hash: "0x111" });

      await connectAndWaitForLoad();
      pendingTxSubject.next([tx1]);

      expect(controller.pendingTransactionListItems).toHaveLength(1);
      expect(host.requestUpdate).toHaveBeenCalled();
    });

    it("should clear pending list when all are confirmed", async () => {
      const tx1 = createPendingTx({ hash: "0x111" });

      await connectAndWaitForLoad();
      pendingTxSubject.next([tx1]);
      expect(controller.pendingTransactionListItems).toHaveLength(1);

      pendingTxSubject.next([]);
      expect(controller.pendingTransactionListItems).toHaveLength(0);
    });

    it("returns an empty list while no account is selected", () => {
      const tx = createPendingTx({ hash: "0x111" });

      pendingTxSubject.next([tx]);
      controller.hostConnected();

      expect(controller.pendingTransactionListItems).toEqual([]);
    });

    it("hides pending txs whose address differs from the selected account", async () => {
      const matching = createPendingTx({
        hash: "0xmine",
        address: account.freshAddress,
      });
      const otherAccount = createPendingTx({
        hash: "0xtheirs",
        address: "0xdifferent",
      });

      await connectAndWaitForLoad();
      pendingTxSubject.next([matching, otherAccount]);

      expect(controller.pendingTransactionListItems).toHaveLength(1);
      expect(controller.pendingTransactionListItems[0]?.hash).toBe("0xmine");
    });

    it("hides pending txs whose currency differs from the selected account", async () => {
      const sameAddressOtherChain = createPendingTx({
        hash: "0xother-chain",
        address: account.freshAddress,
        ledgerId: "polygon",
      });

      await connectAndWaitForLoad();
      pendingTxSubject.next([sameAddressOtherChain]);

      expect(controller.pendingTransactionListItems).toEqual([]);
    });

    it("re-filters the global pending list when the user switches account", async () => {
      const txAccount1 = createPendingTx({
        hash: "0x1",
        address: "0xabc123",
        ledgerId: "ethereum",
      });
      const txAccount2 = createPendingTx({
        hash: "0x2",
        address: "0xdef456",
        ledgerId: "ethereum",
      });

      await connectAndWaitForLoad();
      pendingTxSubject.next([txAccount1, txAccount2]);
      expect(controller.pendingTransactionListItems).toHaveLength(1);
      expect(controller.pendingTransactionListItems[0]?.hash).toBe("0x1");

      const account2 = createDetailedAccount({
        id: "account-2",
        freshAddress: "0xdef456",
      });
      fetchSelectedAccount.mockResolvedValue(account2);
      contextSubject.next(
        createContext({
          selectedAccounts: new Map<BlockchainFamily, Account>([
            [
              DEFAULT_BLOCKCHAIN_FAMILY,
              createAccount({ freshAddress: "0xdef456" }),
            ],
          ]),
        }),
      );

      await vi.waitFor(() => {
        expect(controller.selectedAccount?.freshAddress).toBe("0xdef456");
      });

      expect(controller.pendingTransactionListItems).toHaveLength(1);
      expect(controller.pendingTransactionListItems[0]?.hash).toBe("0x2");
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
      fetchSelectedAccount.mockResolvedValue(accountWithExplorerUrl);

      controller.hostConnected();

      await vi.waitFor(() => {
        expect(controller.transactionListItems[0]?.explorerUrl).toBe(
          "https://etherscan.io/tx/0xabc",
        );
      });
    });

    it("should propagate explorerUrl from pending transactions to the list row", async () => {
      const tx = createPendingTx({
        hash: "0xpending1",
        explorerUrl: "https://etherscan.io/tx/0xpending1",
      });

      await connectAndWaitForLoad();
      pendingTxSubject.next([tx]);

      expect(controller.pendingTransactionListItems[0]?.explorerUrl).toBe(
        "https://etherscan.io/tx/0xpending1",
      );
    });

    it("should leave explorerUrl undefined when upstream did not provide one", async () => {
      const tx = createPendingTx({ hash: "0xnoexplorer" });

      await connectAndWaitForLoad();
      pendingTxSubject.next([tx]);

      expect(
        controller.pendingTransactionListItems[0]?.explorerUrl,
      ).toBeUndefined();
    });
  });
});
