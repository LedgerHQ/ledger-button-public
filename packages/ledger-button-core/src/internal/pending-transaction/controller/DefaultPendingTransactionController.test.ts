import { Left, Right } from "purify-ts";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FetchSelectedAccountUseCase } from "@internal/account/use-case/fetchSelectedAccountUseCase.js";
import type { ContextService } from "@internal/context/ContextService.js";

import type { PendingTransaction } from "../model/PendingTransaction.js";
import type { ConfirmPendingTransactionsUseCase } from "../use-case/ConfirmPendingTransactionsUseCase.js";
import type { HydratePendingTransactionsWithFiatUseCase } from "../use-case/HydratePendingTransactionsWithFiatUseCase.js";
import { DefaultPendingTransactionController } from "./DefaultPendingTransactionController.js";

function createMockLogger() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    fatal: vi.fn(),
    subscribers: [],
  };
}

function createMockLoggerFactory() {
  return vi.fn().mockReturnValue(createMockLogger());
}

function createMockStorageService() {
  const store: PendingTransaction[] = [];
  return {
    add: vi.fn((tx: PendingTransaction) => store.push(tx)),
    getAll: vi.fn(() => [...store]),
    remove: vi.fn((hash: string) => {
      const idx = store.findIndex((tx) => tx.hash === hash);
      if (idx >= 0) store.splice(idx, 1);
    }),
    _store: store,
  };
}

function createMockCheckPendingStatus() {
  return {
    execute: vi.fn().mockResolvedValue(Right([])),
  };
}

function createMockHydrateUseCase() {
  return {
    execute: vi
      .fn()
      .mockImplementation(async (txs: PendingTransaction[]) => txs),
  };
}

function createMockFetchSelectedAccountUseCase() {
  return {
    execute: vi.fn().mockResolvedValue(Right({})),
  };
}

const hydratedContext = {
  chainId: 1,
  selectedAccounts: new Map([
    [
      "ethereum",
      {
        freshAddress: "0x1234",
        currencyId: "ethereum",
        ticker: "ETH",
      },
    ],
  ]),
};

const skeletonContext = {
  chainId: 1,
  selectedAccounts: new Map([
    [
      "ethereum",
      {
        freshAddress: "0x1234",
        currencyId: "ethereum",
        ticker: "",
      },
    ],
  ]),
};

function createMockContextService(
  initialContext: Record<string, unknown> = hydratedContext,
) {
  const contextSubject = new BehaviorSubject(initialContext);
  return {
    observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
    getContext: vi.fn().mockReturnValue(initialContext),
    onEvent: vi.fn(),
    _contextSubject: contextSubject,
  };
}

function createPendingTx(
  overrides: Partial<PendingTransaction> = {},
): PendingTransaction {
  return {
    hash: "0xabc123",
    chainId: 1,
    address: "0x1234",
    timestamp: "2026-03-16T10:00:00.000Z",
    type: "sent",
    value: "1000000000000000000",
    formattedValue: "1 ETH",
    ticker: "ETH",
    currencyName: "Ethereum",
    ledgerId: "ethereum",
    ...overrides,
  };
}

describe("DefaultPendingTransactionController", () => {
  let controller: DefaultPendingTransactionController;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  let mockCheckPendingStatus: ReturnType<typeof createMockCheckPendingStatus>;
  let mockHydrateUseCase: ReturnType<typeof createMockHydrateUseCase>;
  let mockContextService: ReturnType<typeof createMockContextService>;
  let mockFetchSelectedAccount: ReturnType<
    typeof createMockFetchSelectedAccountUseCase
  >;

  beforeEach(() => {
    vi.useFakeTimers();
    mockStorageService = createMockStorageService();
    mockCheckPendingStatus = createMockCheckPendingStatus();
    mockHydrateUseCase = createMockHydrateUseCase();
    mockContextService = createMockContextService();
    mockFetchSelectedAccount = createMockFetchSelectedAccountUseCase();

    controller = new DefaultPendingTransactionController(
      createMockLoggerFactory(),
      mockStorageService,
      mockCheckPendingStatus as unknown as ConfirmPendingTransactionsUseCase,
      mockContextService,
      mockHydrateUseCase as unknown as HydratePendingTransactionsWithFiatUseCase,
      mockFetchSelectedAccount as unknown as FetchSelectedAccountUseCase,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("observePendingTransactions", () => {
    it("should emit empty array initially when storage is empty", async () => {
      const value = await firstValueFrom(
        controller.observePendingTransactions(),
      );
      expect(value).toEqual([]);
    });
  });

  describe("track", () => {
    it("should emit updated state after track is called", async () => {
      const tx = createPendingTx();
      mockStorageService._store.push(tx);

      controller.track();
      await Promise.resolve();

      const value = await firstValueFrom(
        controller.observePendingTransactions(),
      );
      expect(value).toEqual([tx]);
    });
  });

  describe("polling lifecycle", () => {
    it("should start polling when track is called", () => {
      const tx = createPendingTx();
      mockStorageService._store.push(tx);

      controller.track();
      vi.advanceTimersByTime(10_000);

      expect(mockCheckPendingStatus.execute).toHaveBeenCalledTimes(1);
    });

    it("should stop polling when all transactions are confirmed", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockCheckPendingStatus.execute.mockResolvedValue(
        Right([{ hash: "0x111", failed: false }]),
      );

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockStorageService.remove).toHaveBeenCalledWith("0x111");

      mockCheckPendingStatus.execute.mockClear();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).not.toHaveBeenCalled();
    });

    it("should continue polling when transactions remain pending", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockCheckPendingStatus.execute.mockResolvedValue(Right([]));

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).toHaveBeenCalledTimes(2);
    });

    it("should restart polling on new track after shutdown", async () => {
      const tx1 = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx1);
      mockCheckPendingStatus.execute.mockResolvedValue(
        Right([{ hash: "0x111", failed: false }]),
      );

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);

      mockCheckPendingStatus.execute.mockClear();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).not.toHaveBeenCalled();

      const tx2 = createPendingTx({ hash: "0x222" });
      mockStorageService._store.push(tx2);
      mockCheckPendingStatus.execute.mockResolvedValue(Right([]));

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("page refresh recovery", () => {
    it("should emit stored pending transactions immediately on construction", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      const storageWithData = createMockStorageService();
      storageWithData._store.push(tx);

      const restoredController = new DefaultPendingTransactionController(
        createMockLoggerFactory(),
        storageWithData,
        mockCheckPendingStatus as unknown as ConfirmPendingTransactionsUseCase,
        mockContextService,
        mockHydrateUseCase as unknown as HydratePendingTransactionsWithFiatUseCase,
        mockFetchSelectedAccount as unknown as FetchSelectedAccountUseCase,
      );

      const value = await firstValueFrom(
        restoredController.observePendingTransactions(),
      );
      expect(value).toEqual([tx]);
    });

    it("should not start polling with skeleton account (empty ticker)", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      const storageWithData = createMockStorageService();
      storageWithData._store.push(tx);

      const skeletonCtx = createMockContextService(skeletonContext);

      new DefaultPendingTransactionController(
        createMockLoggerFactory(),
        storageWithData,
        mockCheckPendingStatus as unknown as ConfirmPendingTransactionsUseCase,
        skeletonCtx,
        mockHydrateUseCase as unknown as HydratePendingTransactionsWithFiatUseCase,
        mockFetchSelectedAccount as unknown as FetchSelectedAccountUseCase,
      );

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).not.toHaveBeenCalled();
    });

    it("should start polling once context is hydrated with full account", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      const storageWithData = createMockStorageService();
      storageWithData._store.push(tx);

      const skeletonCtx = createMockContextService(skeletonContext);

      new DefaultPendingTransactionController(
        createMockLoggerFactory(),
        storageWithData,
        mockCheckPendingStatus as unknown as ConfirmPendingTransactionsUseCase,
        skeletonCtx as unknown as ContextService,
        mockHydrateUseCase as unknown as HydratePendingTransactionsWithFiatUseCase,
        mockFetchSelectedAccount as unknown as FetchSelectedAccountUseCase,
      );

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).not.toHaveBeenCalled();

      skeletonCtx.getContext.mockReturnValue(hydratedContext);
      skeletonCtx._contextSubject.next(hydratedContext);

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).toHaveBeenCalled();
    });

    it("should start polling on construction when account is already available", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      const storageWithData = createMockStorageService();
      storageWithData._store.push(tx);

      new DefaultPendingTransactionController(
        createMockLoggerFactory(),
        storageWithData,
        mockCheckPendingStatus as unknown as ConfirmPendingTransactionsUseCase,
        mockContextService,
        mockHydrateUseCase as unknown as HydratePendingTransactionsWithFiatUseCase,
        mockFetchSelectedAccount as unknown as FetchSelectedAccountUseCase,
      );

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).toHaveBeenCalled();
    });
  });

  describe("pending removal on confirmation", () => {
    it("should emit an empty pending list after confirmed transactions are removed from storage", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockCheckPendingStatus.execute.mockResolvedValue(
        Right([{ hash: "0x111", failed: false }]),
      );

      const emissions: PendingTransaction[][] = [];
      const subscription = controller
        .observePendingTransactions()
        .subscribe((value) => emissions.push(value));

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(emissions.at(-1)).toEqual([]);
      expect(mockStorageService.remove).toHaveBeenCalledWith("0x111");

      subscription.unsubscribe();
    });
  });

  describe("transaction history refresh", () => {
    it("should refresh transaction history when transactions are confirmed", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockCheckPendingStatus.execute.mockResolvedValue(
        Right([{ hash: "0x111", failed: false }]),
      );

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockFetchSelectedAccount.execute).toHaveBeenCalledTimes(1);
    });

    it("should not refresh transaction history when no transactions are confirmed", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockCheckPendingStatus.execute.mockResolvedValue(Right([]));

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockFetchSelectedAccount.execute).not.toHaveBeenCalled();
    });

    it("should continue polling even if transaction history refresh fails", async () => {
      const tx1 = createPendingTx({ hash: "0x111" });
      const tx2 = createPendingTx({ hash: "0x222" });
      mockStorageService._store.push(tx1, tx2);

      mockCheckPendingStatus.execute.mockResolvedValue(
        Right([{ hash: "0x111", failed: false }]),
      );
      mockFetchSelectedAccount.execute.mockResolvedValue(
        Left(new Error("Refresh failed")),
      );

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockFetchSelectedAccount.execute).toHaveBeenCalledTimes(1);

      mockCheckPendingStatus.execute.mockResolvedValue(Right([]));
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockCheckPendingStatus.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe("error resilience", () => {
    it("should continue polling when Explorer call fails", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockCheckPendingStatus.execute.mockResolvedValue(
        Left(new Error("Network error")),
      );

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockStorageService.remove).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockCheckPendingStatus.execute).toHaveBeenCalledTimes(2);
    });

    it("confirms pending transactions using their stored account even without a selected account", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockContextService.getContext.mockReturnValue({
        chainId: 1,
        selectedAccounts: new Map(),
      });

      controller.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockCheckPendingStatus.execute).toHaveBeenCalledWith(
        "ethereum",
        "0x1234",
        ["0x111"],
      );
    });
  });

  describe("family-agnostic (Solana active)", () => {
    const solanaContext = {
      chainId: 1,
      activeFamily: "solana",
      selectedAccounts: new Map([
        [
          "solana",
          {
            freshAddress: "So1ana1111",
            currencyId: "solana",
            ticker: "SOL",
          },
        ],
      ]),
    };

    it("polls and refreshes the active Solana account, not the ethereum default", async () => {
      const tx = createPendingTx({
        hash: "0x111",
        ledgerId: "solana",
        address: "So1ana1111",
      });
      const storageWithData = createMockStorageService();
      storageWithData._store.push(tx);
      const solanaCtx = createMockContextService(solanaContext);

      mockCheckPendingStatus.execute.mockResolvedValue(
        Right([{ hash: "0x111", failed: false }]),
      );

      const solanaController = new DefaultPendingTransactionController(
        createMockLoggerFactory(),
        storageWithData,
        mockCheckPendingStatus as unknown as ConfirmPendingTransactionsUseCase,
        solanaCtx as unknown as ContextService,
        mockHydrateUseCase as unknown as HydratePendingTransactionsWithFiatUseCase,
        mockFetchSelectedAccount as unknown as FetchSelectedAccountUseCase,
      );

      solanaController.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockCheckPendingStatus.execute).toHaveBeenCalledWith(
        "solana",
        "So1ana1111",
        ["0x111"],
      );
      expect(mockFetchSelectedAccount.execute).toHaveBeenCalledWith("solana");
    });

    it("confirms mixed EVM and Solana pendings each against their own account", async () => {
      const evmTx = createPendingTx({
        hash: "0xevm",
        ledgerId: "ethereum",
        address: "0x1234",
      });
      const solTx = createPendingTx({
        hash: "0xsol",
        ledgerId: "solana",
        address: "So1ana1111",
      });
      const storageWithData = createMockStorageService();
      storageWithData._store.push(evmTx, solTx);
      const solanaCtx = createMockContextService(solanaContext);

      mockCheckPendingStatus.execute.mockResolvedValue(Right([]));

      const mixedController = new DefaultPendingTransactionController(
        createMockLoggerFactory(),
        storageWithData,
        mockCheckPendingStatus as unknown as ConfirmPendingTransactionsUseCase,
        solanaCtx as unknown as ContextService,
        mockHydrateUseCase as unknown as HydratePendingTransactionsWithFiatUseCase,
        mockFetchSelectedAccount as unknown as FetchSelectedAccountUseCase,
      );

      mixedController.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockCheckPendingStatus.execute).toHaveBeenCalledWith(
        "ethereum",
        "0x1234",
        ["0xevm"],
      );
      expect(mockCheckPendingStatus.execute).toHaveBeenCalledWith(
        "solana",
        "So1ana1111",
        ["0xsol"],
      );
    });

    it("refreshes the family of the settled transaction, not the active one", async () => {
      const mixedContext = {
        chainId: 1,
        activeFamily: "ethereum",
        selectedAccounts: new Map([
          [
            "ethereum",
            {
              freshAddress: "0x1234",
              currencyId: "ethereum",
              ticker: "ETH",
            },
          ],
          [
            "solana",
            {
              freshAddress: "So1ana1111",
              currencyId: "solana",
              ticker: "SOL",
            },
          ],
        ]),
      };
      const solTx = createPendingTx({
        hash: "0xsol",
        ledgerId: "solana",
        address: "So1ana1111",
      });
      const storageWithData = createMockStorageService();
      storageWithData._store.push(solTx);
      const mixedCtx = createMockContextService(mixedContext);

      mockCheckPendingStatus.execute.mockResolvedValue(
        Right([{ hash: "0xsol", failed: false }]),
      );

      const mixedController = new DefaultPendingTransactionController(
        createMockLoggerFactory(),
        storageWithData,
        mockCheckPendingStatus as unknown as ConfirmPendingTransactionsUseCase,
        mixedCtx as unknown as ContextService,
        mockHydrateUseCase as unknown as HydratePendingTransactionsWithFiatUseCase,
        mockFetchSelectedAccount as unknown as FetchSelectedAccountUseCase,
      );

      mixedController.track();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockFetchSelectedAccount.execute).toHaveBeenCalledWith("solana");
      expect(mockFetchSelectedAccount.execute).not.toHaveBeenCalledWith(
        "ethereum",
      );
    });
  });
});
