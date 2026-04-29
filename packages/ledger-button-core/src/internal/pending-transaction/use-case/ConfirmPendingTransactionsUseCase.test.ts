import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransactionHistoryError } from "../../transaction-history/model/TransactionHistoryError.js";
import type {
  AlpacaOperation,
  AlpacaOperationsResponse,
} from "../../transaction-history/model/transactionHistoryTypes.js";
import { ConfirmPendingTransactionsUseCase } from "./ConfirmPendingTransactionsUseCase.js";

function makeOp(hash: string): AlpacaOperation {
  return {
    id: `js:2:ethereum:0xowner:-${hash}-OUT-i0`,
    type: "OUT",
    value: "0",
    senders: [],
    recipients: [],
    asset: { type: "native" },
    tx: {
      hash,
      fees: "0",
      block: { height: 1 },
      failed: false,
    },
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

  it("should return confirmed hashes that appear in the Alpaca response", async () => {
    const alpacaResponse: AlpacaOperationsResponse = {
      items: [makeOp("0xaaa"), makeOp("0xbbb"), makeOp("0xccc")],
    };
    mockDataSource.getTransactions.mockResolvedValue(Right(alpacaResponse));

    const result = await useCase.execute("ethereum", "0x1234", [
      "0xaaa",
      "0xddd",
    ]);

    expect(result.isRight()).toBe(true);
    expect(result.unsafeCoerce()).toEqual(["0xaaa"]);
  });

  it("should return empty array when no pending hashes match", async () => {
    const alpacaResponse: AlpacaOperationsResponse = {
      items: [makeOp("0xzzz")],
    };
    mockDataSource.getTransactions.mockResolvedValue(Right(alpacaResponse));

    const result = await useCase.execute("ethereum", "0x1234", [
      "0xaaa",
      "0xbbb",
    ]);

    expect(result.isRight()).toBe(true);
    expect(result.unsafeCoerce()).toEqual([]);
  });

  it("should return Left when the Alpaca API fails", async () => {
    mockDataSource.getTransactions.mockResolvedValue(
      Left(new TransactionHistoryError("Network error")),
    );

    const result = await useCase.execute("ethereum", "0x1234", ["0xaaa"]);

    expect(result.isLeft()).toBe(true);
  });
});
