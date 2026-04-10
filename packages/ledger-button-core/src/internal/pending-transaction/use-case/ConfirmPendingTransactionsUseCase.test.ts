import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransactionHistoryError } from "../../transaction-history/model/TransactionHistoryError.js";
import type { ExplorerResponse } from "../../transaction-history/model/transactionHistoryTypes.js";
import { ConfirmPendingTransactionsUseCase } from "./ConfirmPendingTransactionsUseCase.js";

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

  it("should return confirmed hashes that appear in Explorer response", async () => {
    const explorerResponse: ExplorerResponse = {
      data: [
        { hash: "0xaaa" } as ExplorerResponse["data"][0],
        { hash: "0xbbb" } as ExplorerResponse["data"][0],
        { hash: "0xccc" } as ExplorerResponse["data"][0],
      ],
      token: null,
    };
    mockDataSource.getTransactions.mockResolvedValue(Right(explorerResponse));

    const result = await useCase.execute("ethereum", "0x1234", [
      "0xaaa",
      "0xddd",
    ]);

    expect(result.isRight()).toBe(true);
    expect(result.unsafeCoerce()).toEqual(["0xaaa"]);
  });

  it("should return empty array when no pending hashes match", async () => {
    const explorerResponse: ExplorerResponse = {
      data: [{ hash: "0xzzz" } as ExplorerResponse["data"][0]],
      token: null,
    };
    mockDataSource.getTransactions.mockResolvedValue(Right(explorerResponse));

    const result = await useCase.execute("ethereum", "0x1234", [
      "0xaaa",
      "0xbbb",
    ]);

    expect(result.isRight()).toBe(true);
    expect(result.unsafeCoerce()).toEqual([]);
  });

  it("should return Left when Explorer API fails", async () => {
    mockDataSource.getTransactions.mockResolvedValue(
      Left(new TransactionHistoryError("Network error")),
    );

    const result = await useCase.execute("ethereum", "0x1234", ["0xaaa"]);

    expect(result.isLeft()).toBe(true);
  });
});
