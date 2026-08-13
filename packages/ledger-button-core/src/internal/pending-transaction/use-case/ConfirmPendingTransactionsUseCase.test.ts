import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransactionHistoryError } from "@internal/transaction-history/model/TransactionHistoryError.js";
import type {
  TransactionHistoryEntry,
  TransactionHistoryPage,
} from "@internal/transaction-history/model/transactionHistoryTypes.js";

import { ConfirmPendingTransactionsUseCase } from "./ConfirmPendingTransactionsUseCase.js";

function makeEntry(
  hash: string,
  failed = false,
): TransactionHistoryEntry {
  return {
    hash,
    value: "0",
    senders: [],
    recipients: [],
    fee: undefined,
    failed,
    blockHeight: 1,
    timestamp: "2024-01-15T10:30:00Z",
    asset: { isNative: true },
    direction: "sent",
    isFeeOnlyOperation: false,
  };
}

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

function createMockDataSource() {
  return {
    getTransactions: vi.fn(),
  };
}

describe("ConfirmPendingTransactionsUseCase", () => {
  let useCase: ConfirmPendingTransactionsUseCase;
  let mockDataSource: ReturnType<typeof createMockDataSource>;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    useCase = new ConfirmPendingTransactionsUseCase(
      mockDataSource,
      createMockLoggerFactory(),
    );
  });

  it("should forward currencyId and address to the data source", async () => {
    const page: TransactionHistoryPage = { items: [] };
    mockDataSource.getTransactions.mockResolvedValue(Right(page));

    await useCase.execute("ethereum", "0x1234", []);

    expect(mockDataSource.getTransactions).toHaveBeenCalledWith(
      "0x1234",
      "ethereum",
    );
  });

  it("should return confirmed hashes that appear on chain", async () => {
    const page: TransactionHistoryPage = {
      items: [makeEntry("0xaaa"), makeEntry("0xbbb"), makeEntry("0xccc")],
    };
    mockDataSource.getTransactions.mockResolvedValue(Right(page));

    const result = await useCase.execute("ethereum", "0x1234", [
      "0xaaa",
      "0xddd",
    ]);

    expect(result.isRight()).toBe(true);
    expect(result.unsafeCoerce()).toEqual([{ hash: "0xaaa", failed: false }]);
  });

  it("should return failed flag when the on-chain entry failed", async () => {
    const page: TransactionHistoryPage = {
      items: [makeEntry("0xaaa", true)],
    };
    mockDataSource.getTransactions.mockResolvedValue(Right(page));

    const result = await useCase.execute("ethereum", "0x1234", ["0xaaa"]);

    expect(result.isRight()).toBe(true);
    expect(result.unsafeCoerce()).toEqual([{ hash: "0xaaa", failed: true }]);
  });

  it("should return an empty array when no pending hashes match", async () => {
    const page: TransactionHistoryPage = { items: [makeEntry("0xzzz")] };
    mockDataSource.getTransactions.mockResolvedValue(Right(page));

    const result = await useCase.execute("ethereum", "0x1234", [
      "0xaaa",
      "0xbbb",
    ]);

    expect(result.isRight()).toBe(true);
    expect(result.unsafeCoerce()).toEqual([]);
  });

  it("should return Left when the data source fails", async () => {
    mockDataSource.getTransactions.mockResolvedValue(
      Left(new TransactionHistoryError("Network error")),
    );

    const result = await useCase.execute("ethereum", "0x1234", ["0xaaa"]);

    expect(result.isLeft()).toBe(true);
  });
});
