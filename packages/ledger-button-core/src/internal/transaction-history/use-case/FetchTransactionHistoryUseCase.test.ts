import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CalDataSource } from "../../balance/datasource/cal/CalDataSource.js";
import type { TransactionHistoryDataSource } from "../datasource/TransactionHistoryDataSource.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import type {
  AlpacaOperation,
  AlpacaOperationsResponse,
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

function createMockCalDataSource(): {
  getTokenInformation: ReturnType<typeof vi.fn>;
  getCurrencyInformation: ReturnType<typeof vi.fn>;
} {
  return {
    getTokenInformation: vi.fn().mockResolvedValue(
      Right({
        id: "ethereum/erc20/usdc",
        name: "USD Coin",
        ticker: "USDC",
        decimals: 6,
      }),
    ),
    getCurrencyInformation: vi.fn().mockResolvedValue(
      Right({
        id: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
        decimals: 18,
        transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
      }),
    ),
  };
}

function createMockOperation(
  overrides: Partial<AlpacaOperation> = {},
): AlpacaOperation {
  return {
    hash: "0xabc123",
    type: "send",
    senders: [],
    recipients: [],
    value: "0",
    asset: { type: "native" },
    date: "2024-01-15T10:30:00Z",
    ...overrides,
  };
}

describe("FetchTransactionHistoryUseCase", () => {
  let useCase: FetchTransactionHistoryUseCase;
  let mockDataSource: ReturnType<typeof createMockDataSource>;
  let mockCalDataSource: ReturnType<typeof createMockCalDataSource>;
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testBlockchain = "eth";
  const testCurrencyId = "ethereum";
  const resolvedNetwork = "ethereum";

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    mockCalDataSource = createMockCalDataSource();

    useCase = new FetchTransactionHistoryUseCase(
      createMockLoggerFactory(),
      mockDataSource as unknown as TransactionHistoryDataSource,
      mockCalDataSource as unknown as CalDataSource,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should call datasource with the resolved Alpaca network derived from currencyId", async () => {
      const response: AlpacaOperationsResponse = { data: [] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      await useCase.execute(testBlockchain, testAddress, testCurrencyId, {
        batchSize: 50,
      });

      expect(mockDataSource.getTransactions).toHaveBeenCalledWith(
        resolvedNetwork,
        testAddress,
        { batchSize: 50 },
      );
    });

    it("should resolve to the correct Alpaca network for non-ethereum currencies", async () => {
      const response: AlpacaOperationsResponse = { data: [] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      await useCase.execute("polygon", testAddress, "polygon");

      expect(mockDataSource.getTransactions).toHaveBeenCalledWith(
        "polygon",
        testAddress,
        undefined,
      );
    });

    it("should return empty transactions array when no operations are returned", async () => {
      const response: AlpacaOperationsResponse = { data: [] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toEqual({
        transactions: [],
        nextPageToken: undefined,
      });
    });

    it("should return nextPageToken when token is present", async () => {
      const response: AlpacaOperationsResponse = {
        data: [],
        token: "next-page-token",
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("nextPageToken", "next-page-token");
    });

    it("should not return nextPageToken when token is missing", async () => {
      const response: AlpacaOperationsResponse = { data: [] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("nextPageToken", undefined);
    });

    it("should return Left with error when datasource fails", async () => {
      const error = new TransactionHistoryError("Network error", {
        address: testAddress,
        network: resolvedNetwork,
      });
      mockDataSource.getTransactions.mockResolvedValue(Left(error));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toBe(error);
    });
  });

  describe("transaction type detection", () => {
    it("should mark operation as 'sent' when address is in senders", async () => {
      const op = createMockOperation({
        hash: "0xsent",
        senders: [{ address: testAddress, amount: "1000000000000000000" }],
        recipients: [
          { address: "0xrecipient", amount: "1000000000000000000" },
        ],
        value: "1000000000000000000",
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("type", "sent");
    });

    it("should mark operation as 'received' when address is in recipients", async () => {
      const op = createMockOperation({
        hash: "0xreceived",
        senders: [{ address: "0xsender", amount: "1000000000000000000" }],
        recipients: [
          { address: testAddress, amount: "1000000000000000000" },
        ],
        value: "1000000000000000000",
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("type", "received");
    });

    it("should handle case-insensitive address matching for senders", async () => {
      const upperCaseAddress = testAddress.toUpperCase();
      const op = createMockOperation({
        senders: [{ address: upperCaseAddress, amount: "1000000000000000000" }],
        recipients: [{ address: "0xrecipient", amount: "0" }],
        value: "1000000000000000000",
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("type", "sent");
    });
  });

  describe("value calculation", () => {
    it("should use op.value for native transfers when set", async () => {
      const op = createMockOperation({
        senders: [{ address: "0xsender" }],
        recipients: [{ address: testAddress, amount: "1000000000000000000" }],
        value: "1000000000000000000",
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("value", "1000000000000000000");
    });

    it("should sum recipient amounts when op.value is zero (received)", async () => {
      const op = createMockOperation({
        senders: [{ address: "0xsender" }],
        recipients: [
          { address: testAddress, amount: "1000000000000000" },
          { address: testAddress, amount: "1801780000000000" },
          { address: "0xother", amount: "999" },
        ],
        value: "0",
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("value", "2801780000000000");
    });

    it("should use ERC20 token info from CAL for ERC20 transfers", async () => {
      const op = createMockOperation({
        hash: "0xtoken",
        senders: [{ address: "0xsender" }],
        recipients: [{ address: testAddress, amount: "5000000" }],
        value: "5000000",
        asset: { type: "erc20", assetReference: "0xcontract" },
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      const transactions = (data as { transactions: unknown[] }).transactions;
      expect(transactions[0]).toHaveProperty("value", "5000000");
      expect(transactions[0]).toHaveProperty("ticker", "USDC");
      expect(transactions[0]).toHaveProperty("currencyName", "USD Coin");
      expect(transactions[0]).toHaveProperty("ledgerId", "ethereum/erc20/usdc");
    });

    it("should cache CAL token info across multiple calls for the same contract", async () => {
      const op = createMockOperation({
        hash: "0xtoken1",
        senders: [{ address: "0xsender" }],
        recipients: [{ address: testAddress, amount: "1000000" }],
        value: "1000000",
        asset: { type: "erc20", assetReference: "0xcontract" },
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      await useCase.execute(testBlockchain, testAddress, testCurrencyId);
      await useCase.execute(testBlockchain, testAddress, testCurrencyId);

      expect(mockCalDataSource.getTokenInformation).toHaveBeenCalledTimes(1);
    });

    it("should fall back to default unknown-token info when CAL lookup fails", async () => {
      mockCalDataSource.getTokenInformation.mockResolvedValueOnce(
        Left(new Error("CAL down")),
      );

      const op = createMockOperation({
        senders: [{ address: "0xsender" }],
        recipients: [{ address: testAddress, amount: "5000000" }],
        value: "5000000",
        asset: { type: "erc20", assetReference: "0xunknown" },
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      const transactions = (data as { transactions: unknown[] }).transactions;
      expect(transactions[0]).toHaveProperty("ticker", "???");
      expect(transactions[0]).toHaveProperty("currencyName", "Unknown Token");
      expect(transactions[0]).toHaveProperty(
        "ledgerId",
        "ethereum/erc20/unknown",
      );
    });
  });

  describe("timestamp extraction", () => {
    it("should use blockTime when available", async () => {
      const op = createMockOperation({
        date: "2024-01-15T10:30:00Z",
        blockTime: "2024-01-15T10:35:00Z",
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("timestamp", "2024-01-15T10:35:00Z");
    });

    it("should fall back to date when blockTime is not available", async () => {
      const op = createMockOperation({
        date: "2024-01-15T10:30:00Z",
        blockTime: undefined,
      });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(
        (data as { transactions: unknown[] }).transactions[0],
      ).toHaveProperty("timestamp", "2024-01-15T10:30:00Z");
    });
  });

  describe("malformed operations", () => {
    it("should skip operations without a hash", async () => {
      const op = createMockOperation({ hash: "" });

      const response: AlpacaOperationsResponse = { data: [op] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect((data as { transactions: unknown[] }).transactions).toHaveLength(
        0,
      );
    });
  });

  describe("transaction transformation", () => {
    it("should correctly transform multiple operations with mixed direction", async () => {
      const sentOp = createMockOperation({
        hash: "0xsent123",
        senders: [{ address: testAddress, amount: "500000000000000000" }],
        recipients: [
          { address: "0xrecipient", amount: "500000000000000000" },
        ],
        value: "500000000000000000",
        date: "2024-01-15T10:00:00Z",
      });

      const receivedOp = createMockOperation({
        hash: "0xreceived456",
        senders: [{ address: "0xsender", amount: "1800000000000000000" }],
        recipients: [
          { address: testAddress, amount: "1800000000000000000" },
        ],
        value: "1800000000000000000",
        date: "2024-01-15T11:00:00Z",
      });

      const response: AlpacaOperationsResponse = {
        data: [sentOp, receivedOp],
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(
        testBlockchain,
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      const transactions = (data as { transactions: unknown[] }).transactions;
      expect(transactions).toHaveLength(2);
      expect(transactions[0]).toEqual({
        hash: "0xsent123",
        type: "sent",
        value: "500000000000000000",
        formattedValue: "0.5",
        currencyName: "Ethereum",
        ticker: "ETH",
        timestamp: "2024-01-15T10:00:00Z",
        ledgerId: "ethereum",
        explorerUrl: "https://etherscan.io/tx/0xsent123",
      });
      expect(transactions[1]).toEqual({
        hash: "0xreceived456",
        type: "received",
        value: "1800000000000000000",
        formattedValue: "1.8",
        currencyName: "Ethereum",
        ticker: "ETH",
        timestamp: "2024-01-15T11:00:00Z",
        ledgerId: "ethereum",
        explorerUrl: "https://etherscan.io/tx/0xreceived456",
      });
    });
  });
});
