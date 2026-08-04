/**
 * @vitest-environment jsdom
 */

import type {
  PendingTransaction,
  SignFlowStatus,
  SignSolanaTransactionParams,
  SignTransactionParams,
  WalletNavigationIntent,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { BehaviorSubject, Subject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../components/index.js", () => ({}));
vi.mock("../onboarding/ledger-sync/ledger-sync", () => ({}));

import type { CoreContext } from "../../context/core-context.js";
import type { LanguageContext } from "../../context/language-context.js";
import type { Navigation } from "../../shared/navigation.js";
import { SignTransactionController } from "./sign-transaction-controller.js";

function createPendingTx(
  overrides: Partial<PendingTransaction> = {},
): PendingTransaction {
  return {
    hash: "0xabc",
    chainId: 1,
    address: "0x0000000000000000000000000000000000000001",
    timestamp: "2026-04-29T10:00:00.000Z",
    type: "sent",
    value: "0",
    formattedValue: "0 ETH",
    ticker: "ETH",
    currencyName: "Ethereum",
    ledgerId: "ethereum",
    ...overrides,
  };
}

describe("SignTransactionController broadcast lifecycle", () => {
  let controller: SignTransactionController;
  let host: ReactiveControllerHost;
  let core: CoreContext;
  let navigation: Navigation;
  let lang: LanguageContext;
  let signFlowSubject: Subject<SignFlowStatus>;
  let pendingTransactionsSubject: BehaviorSubject<PendingTransaction[]>;
  let mockIntent: WalletNavigationIntent;

  const signParams: SignTransactionParams = {
    method: "eth_sendTransaction",
    broadcast: true,
    transaction: {
      chainId: 1,
      to: "0x0000000000000000000000000000000000000001",
      data: "0x",
      value: "0x0",
    },
  };

  const broadcastSuccessResult: SignFlowStatus = {
    signType: "transaction",
    status: "success",
    data: {
      hash: "0xabc",
      rawTransaction: new Uint8Array(),
      signedRawTransaction: "0x",
    },
  };

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    signFlowSubject = new Subject<SignFlowStatus>();
    pendingTransactionsSubject = new BehaviorSubject<PendingTransaction[]>([]);

    mockIntent = {
      name: "signTransaction",
      params: signParams,
      status$: signFlowSubject.asObservable(),
      finish: vi.fn(),
      retry: vi.fn(),
    };

    core = {
      observePendingTransactions: vi
        .fn()
        .mockReturnValue(pendingTransactionsSubject.asObservable()),
      getSelectedAccount: vi.fn().mockReturnValue(undefined),
      getCurrencyInfo: vi.fn().mockResolvedValue({}),
    } as unknown as CoreContext;

    navigation = {
      navigateTo: vi.fn(),
      navigateBack: vi.fn(),
      host: {},
    } as unknown as Navigation;

    lang = {
      currentTranslation: {
        common: {
          button: { close: "Close" },
          device: { model: { fallback: "Ledger" } },
        },
        signMessage: {
          success: {
            title: "Message signed",
            description: "Message signature successful",
          },
        },
        signTransaction: {
          success: {
            title: "Transaction sent",
            description: "Transaction was broadcast successfully",
            viewTransaction: "View transaction",
          },
        },
      },
    } as unknown as LanguageContext;

    controller = new SignTransactionController(host, core, navigation, lang);
  });

  it("stays processing while hash has not yet entered the pool, then validates after enter+exit", async () => {
    controller.startSigning(mockIntent);
    signFlowSubject.next(broadcastSuccessResult);

    await vi.waitFor(() => {
      expect(controller.state.screen).toBe("success");
      if (controller.state.screen !== "success") {
        throw new Error("Expected success state");
      }
      expect(controller.state.broadcast?.state).toBe("processing");
    });

    pendingTransactionsSubject.next([createPendingTx({ hash: "0xabc" })]);

    await vi.waitFor(() => {
      if (controller.state.screen !== "success") {
        throw new Error("Expected success state");
      }
      expect(controller.state.broadcast?.state).toBe("processing");
    });

    pendingTransactionsSubject.next([]);

    await vi.waitFor(() => {
      if (controller.state.screen !== "success") {
        throw new Error("Expected success state");
      }
      expect(controller.state.broadcast?.state).toBe("validated");
    });
  });

  it("stays processing while hash is pending then switches to validated", async () => {
    pendingTransactionsSubject.next([createPendingTx({ hash: "0xabc" })]);

    controller.startSigning(mockIntent);
    signFlowSubject.next(broadcastSuccessResult);

    await vi.waitFor(() => {
      expect(controller.state.screen).toBe("success");
      if (controller.state.screen !== "success") {
        throw new Error("Expected success state");
      }
      expect(controller.state.broadcast?.state).toBe("processing");
    });

    pendingTransactionsSubject.next([]);

    await vi.waitFor(() => {
      expect(controller.state.screen).toBe("success");
      if (controller.state.screen !== "success") {
        throw new Error("Expected success state");
      }
      expect(controller.state.broadcast?.state).toBe("validated");
    });
  });

  it("resolves the explorer from the family being signed for, not the active one", async () => {
    core.getSelectedAccount = vi.fn().mockReturnValue({ currencyId: "solana" });
    core.getCurrencyInfo = vi.fn().mockResolvedValue({
      transactionExplorerUrlTemplate: "https://solscan.io/tx/${hash}",
    });

    const solanaParams: SignSolanaTransactionParams = {
      kind: "solana-transaction",
      address: "So1ana1111",
      transaction: new Uint8Array([1, 2, 3]),
    };

    controller.startSigning({ ...mockIntent, params: solanaParams });
    signFlowSubject.next({
      signType: "transaction",
      status: "success",
      data: { hash: "solHash", signature: new Uint8Array() },
    });

    await vi.waitFor(() => {
      if (controller.state.screen !== "success") {
        throw new Error("Expected success state");
      }
      expect(controller.state.status.cta2?.label).toBe("View transaction");
    });

    expect(core.getSelectedAccount).toHaveBeenCalledWith("solana");
    expect(core.getCurrencyInfo).toHaveBeenCalledWith("solana");
  });
});
