import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TransactionHistoryDataSource } from "../datasource/TransactionHistoryDataSource.js";
import type {
  ExplorerResponse,
  ExplorerTransaction,
} from "../model/transactionHistoryTypes.js";
import { FetchTransactionHistoryUseCase } from "./FetchTransactionHistoryUseCase.js";

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

function createMockDataSource(): {
  getTransactions: ReturnType<typeof vi.fn>;
} {
  return {
    getTransactions: vi.fn(),
  };
}

function createMockTransaction(
  overrides: Partial<ExplorerTransaction> = {},
): ExplorerTransaction {
  return {
    hash: "0xabc123",
    received_at: "2024-01-15T10:30:00Z",
    lock_time: 0,
    fees: "21000000000000",
    inputs: [],
    outputs: [],
    confirmations: 10,
    ...overrides,
  };
}

describe("FetchTransactionHistoryUseCase", () => {
  let useCase: FetchTransactionHistoryUseCase;
  let mockDataSource: ReturnType<typeof createMockDataSource>;
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testBlockchain = "eth";

  beforeEach(() => {
    mockDataSource = createMockDataSource();

    useCase = new FetchTransactionHistoryUseCase(
      createMockLoggerFactory(),
      mockDataSource as unknown as TransactionHistoryDataSource,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should return Left with error when datasource fails", async () => {
      const error = new Error("Network error");
      mockDataSource.getTransactions.mockResolvedValue(Left(error));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toBe(error);
    });

    it("should call datasource with correct parameters", async () => {
      const response: ExplorerResponse = {
        truncated: false,
        txs: [],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      await useCase.execute(testBlockchain, testAddress, { batchSize: 50 });

      expect(mockDataSource.getTransactions).toHaveBeenCalledWith(
        testBlockchain,
        testAddress,
        { batchSize: 50 },
      );
    });

    it("should return empty transactions array when no transactions", async () => {
      const response: ExplorerResponse = {
        truncated: false,
        txs: [],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toEqual({
        transactions: [],
        nextPageToken: undefined,
      });
    });

    it("should return nextPageToken when response is truncated", async () => {
      const response: ExplorerResponse = {
        truncated: true,
        txs: [],
        token: "next-page-token",
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("nextPageToken", "next-page-token");
    });

    it("should not return nextPageToken when response is not truncated", async () => {
      const response: ExplorerResponse = {
        truncated: false,
        txs: [],
        token: "some-token",
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("nextPageToken", undefined);
    });
  });

  describe("transaction type detection", () => {
    it("should mark transaction as 'sent' when address is in inputs", async () => {
      const tx = createMockTransaction({
        hash: "0xsent",
        inputs: [
          {
            output_hash: "0x111",
            output_index: 0,
            input_index: 0,
            value: "1000000000000000000",
            address: testAddress,
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "900000000000000000",
            address: "0xrecipient",
            script_hex: "0x",
          },
        ],
      });

      const response: ExplorerResponse = {
        truncated: false,
        txs: [tx],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("transactions");
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("type", "sent");
    });

    it("should mark transaction as 'received' when address is not in inputs", async () => {
      const tx = createMockTransaction({
        hash: "0xreceived",
        inputs: [
          {
            output_hash: "0x111",
            output_index: 0,
            input_index: 0,
            value: "1000000000000000000",
            address: "0xsender",
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "900000000000000000",
            address: testAddress,
            script_hex: "0x",
          },
        ],
      });

      const response: ExplorerResponse = {
        truncated: false,
        txs: [tx],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("transactions");
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("type", "received");
    });

    it("should handle case-insensitive address matching", async () => {
      const upperCaseAddress = testAddress.toUpperCase();
      const tx = createMockTransaction({
        inputs: [
          {
            output_hash: "0x111",
            output_index: 0,
            input_index: 0,
            value: "1000000000000000000",
            address: upperCaseAddress,
            sequence: 0,
          },
        ],
        outputs: [],
      });

      const response: ExplorerResponse = {
        truncated: false,
        txs: [tx],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("transactions");
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("type", "sent");
    });
  });

  describe("value calculation", () => {
    it("should calculate sent value excluding outputs to own address", async () => {
      const tx = createMockTransaction({
        inputs: [
          {
            output_hash: "0x111",
            output_index: 0,
            input_index: 0,
            value: "1000000000000000000",
            address: testAddress,
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "800000000000000000",
            address: "0xrecipient",
            script_hex: "0x",
          },
          {
            output_index: 1,
            value: "100000000000000000",
            address: testAddress, // Change back to sender
            script_hex: "0x",
          },
        ],
      });

      const response: ExplorerResponse = {
        truncated: false,
        txs: [tx],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("transactions");
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("value", "800000000000000000");
    });

    it("should calculate received value from outputs to own address", async () => {
      const tx = createMockTransaction({
        inputs: [
          {
            output_hash: "0x111",
            output_index: 0,
            input_index: 0,
            value: "1000000000000000000",
            address: "0xsender",
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "500000000000000000",
            address: testAddress,
            script_hex: "0x",
          },
          {
            output_index: 1,
            value: "300000000000000000",
            address: testAddress,
            script_hex: "0x",
          },
          {
            output_index: 2,
            value: "100000000000000000",
            address: "0xother",
            script_hex: "0x",
          },
        ],
      });

      const response: ExplorerResponse = {
        truncated: false,
        txs: [tx],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("transactions");
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("value", "800000000000000000");
    });

    it("should return 0 when no relevant outputs", async () => {
      const tx = createMockTransaction({
        inputs: [
          {
            output_hash: "0x111",
            output_index: 0,
            input_index: 0,
            value: "1000000000000000000",
            address: "0xsender",
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "900000000000000000",
            address: "0xother",
            script_hex: "0x",
          },
        ],
      });

      const response: ExplorerResponse = {
        truncated: false,
        txs: [tx],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("transactions");
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("value", "0");
    });
  });

  describe("timestamp extraction", () => {
    it("should use block.time when available", async () => {
      const tx = createMockTransaction({
        received_at: "2024-01-15T10:30:00Z",
        block: {
          hash: "0xblock",
          height: 12345,
          time: "2024-01-15T10:35:00Z",
        },
      });

      const response: ExplorerResponse = {
        truncated: false,
        txs: [tx],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("transactions");
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("timestamp", "2024-01-15T10:35:00Z");
    });

    it("should use received_at when block is not available", async () => {
      const tx = createMockTransaction({
        received_at: "2024-01-15T10:30:00Z",
        block: undefined,
      });

      const response: ExplorerResponse = {
        truncated: false,
        txs: [tx],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("transactions");
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("timestamp", "2024-01-15T10:30:00Z");
    });
  });

  describe("transaction transformation", () => {
    it("should correctly transform multiple transactions", async () => {
      const sentTx = createMockTransaction({
        hash: "0xsent123",
        received_at: "2024-01-15T10:00:00Z",
        inputs: [
          {
            output_hash: "0x111",
            output_index: 0,
            input_index: 0,
            value: "1000000000000000000",
            address: testAddress,
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "500000000000000000",
            address: "0xrecipient",
            script_hex: "0x",
          },
        ],
      });

      const receivedTx = createMockTransaction({
        hash: "0xreceived456",
        received_at: "2024-01-15T11:00:00Z",
        inputs: [
          {
            output_hash: "0x222",
            output_index: 0,
            input_index: 0,
            value: "2000000000000000000",
            address: "0xsender",
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "1800000000000000000",
            address: testAddress,
            script_hex: "0x",
          },
        ],
      });

      const response: ExplorerResponse = {
        truncated: false,
        txs: [sentTx, receivedTx],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testBlockchain, testAddress);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("transactions");
      const transactions = (data as { transactions: unknown[] }).transactions;
      expect(transactions).toHaveLength(2);
      expect(transactions[0]).toEqual({
        hash: "0xsent123",
        type: "sent",
        value: "500000000000000000",
        timestamp: "2024-01-15T10:00:00Z",
      });
      expect(transactions[1]).toEqual({
        hash: "0xreceived456",
        type: "received",
        value: "1800000000000000000",
        timestamp: "2024-01-15T11:00:00Z",
      });
    });
  });
});
