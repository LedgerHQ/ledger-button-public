import { Left, Right } from "purify-ts";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ContextService } from "../../context/ContextService.js";
import type { PendingTransaction } from "../model/PendingTransaction.js";
import type { ConfirmPendingTransactionsUseCase } from "../use-case/ConfirmPendingTransactionsUseCase.js";
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

function createMockConfirmUseCase() {
  return {
    execute: vi.fn().mockResolvedValue(Right([])),
  };
}

const hydratedContext = {
  chainId: 1,
  selectedAccount: {
    freshAddress: "0x1234",
    currencyId: "ethereum",
    ticker: "ETH",
  },
};

const skeletonContext = {
  chainId: 1,
  selectedAccount: {
    freshAddress: "0x1234",
    currencyId: "ethereum",
    ticker: "",
  },
};

function createMockContextService(
  initialContext: Record<string, unknown> = hydratedContext,
) {
  const contextSubject = new BehaviorSubject(initialContext);
  return {
    observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
    getContext: vi.fn().mockReturnValue(initialContext),
    onEvent: vi.fn(),
    hydrateSelectedAccount: vi.fn(),
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
  let mockConfirmUseCase: ReturnType<typeof createMockConfirmUseCase>;
  let mockContextService: ReturnType<typeof createMockContextService>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockStorageService = createMockStorageService();
    mockConfirmUseCase = createMockConfirmUseCase();
    mockContextService = createMockContextService();

    controller = new DefaultPendingTransactionController(
      createMockLoggerFactory(),
      mockStorageService,
      mockConfirmUseCase as unknown as ConfirmPendingTransactionsUseCase,
      mockContextService,
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

      controller.track(tx);

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

      controller.track(tx);
      vi.advanceTimersByTime(10_000);

      expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it("should stop polling when all transactions are confirmed", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockConfirmUseCase.execute.mockResolvedValue(Right(["0x111"]));

      controller.track(tx);
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockStorageService.remove).toHaveBeenCalledWith("0x111");

      mockConfirmUseCase.execute.mockClear();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).not.toHaveBeenCalled();
    });

    it("should continue polling when transactions remain pending", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockConfirmUseCase.execute.mockResolvedValue(Right([]));

      controller.track(tx);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it("should restart polling on new track after shutdown", async () => {
      const tx1 = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx1);
      mockConfirmUseCase.execute.mockResolvedValue(Right(["0x111"]));

      controller.track(tx1);
      await vi.advanceTimersByTimeAsync(10_000);

      mockConfirmUseCase.execute.mockClear();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).not.toHaveBeenCalled();

      const tx2 = createPendingTx({ hash: "0x222" });
      mockStorageService._store.push(tx2);
      mockConfirmUseCase.execute.mockResolvedValue(Right([]));

      controller.track(tx2);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(1);
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
        mockConfirmUseCase as unknown as ConfirmPendingTransactionsUseCase,
        mockContextService,
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
        mockConfirmUseCase as unknown as ConfirmPendingTransactionsUseCase,
        skeletonCtx,
      );

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).not.toHaveBeenCalled();
    });

    it("should start polling once context is hydrated with full account", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      const storageWithData = createMockStorageService();
      storageWithData._store.push(tx);

      const skeletonCtx = createMockContextService(skeletonContext);

      new DefaultPendingTransactionController(
        createMockLoggerFactory(),
        storageWithData,
        mockConfirmUseCase as unknown as ConfirmPendingTransactionsUseCase,
        skeletonCtx as unknown as ContextService,
      );

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).not.toHaveBeenCalled();

      skeletonCtx.getContext.mockReturnValue(hydratedContext);
      skeletonCtx._contextSubject.next(hydratedContext);

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).toHaveBeenCalled();
    });

    it("should start polling on construction when account is already available", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      const storageWithData = createMockStorageService();
      storageWithData._store.push(tx);

      new DefaultPendingTransactionController(
        createMockLoggerFactory(),
        storageWithData,
        mockConfirmUseCase as unknown as ConfirmPendingTransactionsUseCase,
        mockContextService,
      );

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).toHaveBeenCalled();
    });
  });

  describe("error resilience", () => {
    it("should continue polling when Explorer call fails", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockConfirmUseCase.execute.mockResolvedValue(
        Left(new Error("Network error")),
      );

      controller.track(tx);
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockStorageService.remove).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it("should skip tick when no selected account", async () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockStorageService._store.push(tx);

      mockContextService.getContext.mockReturnValue({
        chainId: 1,
        selectedAccount: undefined,
      });

      controller.track(tx);
      await vi.advanceTimersByTimeAsync(10_000);

      expect(mockConfirmUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
