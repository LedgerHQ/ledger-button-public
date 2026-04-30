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
  overrides: Partial<AlpacaOperation> & {
    txOverrides?: Partial<AlpacaOperation["tx"]>;
  } = {},
): AlpacaOperation {
  const { txOverrides, ...opOverrides } = overrides;
  const baseTx: AlpacaOperation["tx"] = {
    hash: "0xabc123",
    fees: "0",
    block: {
      height: 19_000_000,
      hash: "0xblock",
      time: "2024-01-15T10:30:00Z",
    },
    date: "2024-01-15T10:30:00Z",
    failed: false,
  };
  return {
    id: "js:2:ethereum:0xowner:-0xabc123-OUT-i0",
    type: "OUT",
    value: "0",
    senders: [],
    recipients: [],
    asset: { type: "native" },
    ...opOverrides,
    tx: {
      ...baseTx,
      ...(txOverrides ?? {}),
    },
  };
}

describe("FetchTransactionHistoryUseCase", () => {
  let useCase: FetchTransactionHistoryUseCase;
  let mockDataSource: ReturnType<typeof createMockDataSource>;
  let mockCalDataSource: ReturnType<typeof createMockCalDataSource>;
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
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
      const response: AlpacaOperationsResponse = { items: [] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      await useCase.execute(testAddress, testCurrencyId, {
        pageToken: "abc",
      });

      expect(mockDataSource.getTransactions).toHaveBeenCalledWith(
        resolvedNetwork,
        testAddress,
        { pageToken: "abc" },
      );
    });

    it("should resolve to the correct Alpaca network for non-ethereum currencies", async () => {
      const response: AlpacaOperationsResponse = { items: [] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      await useCase.execute(testAddress, "polygon");

      expect(mockDataSource.getTransactions).toHaveBeenCalledWith(
        "polygon",
        testAddress,
        undefined,
      );
    });

    it("should return empty transactions array when no operations are returned", async () => {
      const response: AlpacaOperationsResponse = { items: [] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toEqual({
        transactions: [],
        nextPageToken: undefined,
      });
    });

    it("should return nextPageToken when next is present", async () => {
      const response: AlpacaOperationsResponse = {
        items: [],
        next: "next-page-token",
      };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.isRight()).toBe(true);
      const data = result.extract();
      expect(data).toHaveProperty("nextPageToken", "next-page-token");
    });

    it("should not return nextPageToken when next is missing", async () => {
      const response: AlpacaOperationsResponse = { items: [] };
      mockDataSource.getTransactions.mockResolvedValue(Right(response));

      const result = await useCase.execute(testAddress, testCurrencyId);

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

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toBe(error);
    });
  });

  describe("direction detection", () => {
    it("should mark operation as 'sent' when address is in senders", async () => {
      const op = createMockOperation({
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrecipient"],
        value: "1000000000000000000",
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({ type: "sent", direction: "sent" });
    });

    it("should mark operation as 'received' when address is in recipients", async () => {
      const op = createMockOperation({
        type: "IN",
        senders: ["0xsender"],
        recipients: [testAddress],
        value: "1000000000000000000",
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({ type: "received", direction: "received" });
    });

    it("should match addresses case-insensitively", async () => {
      const op = createMockOperation({
        senders: [testAddress.toUpperCase()],
        recipients: ["0xrecipient"],
        value: "1000000000000000000",
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({ direction: "sent" });
    });

    it("should mark operation as 'self' when address is in both senders and recipients", async () => {
      const op = createMockOperation({
        senders: [testAddress],
        recipients: [testAddress],
        value: "1000000000000000000",
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({ direction: "self", type: "sent" });
    });

    it("should fall back to op.type when neither senders nor recipients contain the user (e.g. FEES rows)", async () => {
      const feesOp = createMockOperation({
        id: "js:2:ethereum:0xowner:-0xfailed-FEES",
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrouter"],
        value: "0",
        txOverrides: { hash: "0xfailed", failed: true, fees: "100" },
      });

      // Edge case: senders/recipients both empty -> rely on type
      const orphan = createMockOperation({
        id: "js:2:ethereum:0xowner:-0xfailed2-FEES",
        type: "IN",
        senders: [],
        recipients: [],
        value: "0",
        txOverrides: { hash: "0xfailed2", failed: true, fees: "100" },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({
          items: [feesOp, orphan],
        } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const txs = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions;
      expect(txs[0]).toMatchObject({ direction: "sent" });
      expect(txs[1]).toMatchObject({ direction: "received" });
    });
  });

  describe("kind detection", () => {
    it("should mark FEES rows as 'contract'", async () => {
      const op = createMockOperation({
        id: "js:2:ethereum:0xowner:-0xfailed-FEES",
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrouter"],
        value: "0",
        txOverrides: { hash: "0xfailed", failed: true, fees: "100" },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({ kind: "contract" });
    });

    it("should mark non-FEES rows as 'transfer'", async () => {
      const op = createMockOperation({
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrecipient"],
        value: "1",
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({ kind: "transfer" });
    });
  });

  describe("status detection", () => {
    it("should mark a confirmed operation as 'confirmed'", async () => {
      const op = createMockOperation({
        senders: [testAddress],
        value: "1",
        txOverrides: { failed: false },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({ status: "confirmed" });
    });

    it("should mark a failed operation as 'failed'", async () => {
      const op = createMockOperation({
        senders: [testAddress],
        value: "1",
        txOverrides: { failed: true, fees: "100" },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({ status: "failed" });
    });
  });

  describe("value calculation", () => {
    it("should use op.value when set", async () => {
      const op = createMockOperation({
        type: "IN",
        senders: ["0xsender"],
        recipients: [testAddress],
        value: "1000000000000000000",
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toHaveProperty("value", "1000000000000000000");
    });

    it("should prefer details.assetAmount over op.value when present", async () => {
      const op = createMockOperation({
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrouter"],
        value: "0",
        details: {
          assetAmount: "997563",
          ledgerOpType: "OUT",
        },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toHaveProperty("value", "997563");
    });

    it("should keep value at '0' for FEES-only rows", async () => {
      const op = createMockOperation({
        id: "js:2:ethereum:0xowner:-0xfailed-FEES",
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrouter"],
        value: "0",
        txOverrides: { hash: "0xfailed", failed: true, fees: "133287000000000" },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({ value: "0", status: "failed" });
    });
  });

  describe("ERC20 / CAL integration", () => {
    it("should use ERC20 token info from CAL for ERC20 transfers", async () => {
      const op = createMockOperation({
        id: "js:2:ethereum:0xowner:-0xtoken-OUT-i0",
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrouter"],
        value: "5000000",
        asset: { type: "erc20", assetReference: "0xcontract" },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({
        value: "5000000",
        ticker: "USDC",
        currencyName: "USD Coin",
        ledgerId: "ethereum/erc20/usdc",
      });
    });

    it("should cache CAL token info across calls for the same contract", async () => {
      const op = createMockOperation({
        type: "OUT",
        senders: [testAddress],
        value: "1000000",
        asset: { type: "erc20", assetReference: "0xcontract" },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      await useCase.execute(testAddress, testCurrencyId);
      await useCase.execute(testAddress, testCurrencyId);

      expect(mockCalDataSource.getTokenInformation).toHaveBeenCalledTimes(1);
    });

    it("should fall back to default unknown-token info when CAL lookup fails", async () => {
      mockCalDataSource.getTokenInformation.mockResolvedValueOnce(
        Left(new Error("CAL down")),
      );

      const op = createMockOperation({
        type: "OUT",
        senders: [testAddress],
        value: "5000000",
        asset: { type: "erc20", assetReference: "0xunknown" },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({
        ticker: "???",
        currencyName: "Unknown Token",
        ledgerId: "ethereum/erc20/unknown",
      });
    });

    it("should fall back to native asset info when op.asset is undefined", async () => {
      const op = createMockOperation({
        type: "IN",
        senders: ["0xsender"],
        recipients: [testAddress],
        value: "1000000000000000000",
        asset: undefined,
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({
        ticker: "ETH",
        currencyName: "Ethereum",
        ledgerId: "ethereum",
      });
    });
  });

  describe("timestamp extraction", () => {
    it("should use tx.block.time when available", async () => {
      const op = createMockOperation({
        senders: [testAddress],
        value: "1",
        txOverrides: {
          date: "2024-01-15T10:30:00Z",
          block: { height: 1, time: "2024-01-15T10:35:00Z" },
        },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toHaveProperty("timestamp", "2024-01-15T10:35:00Z");
    });

    it("should fall back to tx.date when tx.block.time is missing", async () => {
      const op = createMockOperation({
        senders: [testAddress],
        value: "1",
        txOverrides: {
          date: "2024-01-15T10:30:00Z",
          block: { height: 1 },
        },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toHaveProperty("timestamp", "2024-01-15T10:30:00Z");
    });
  });

  describe("transaction transformation", () => {
    it("should propagate the key fields", async () => {
      const sentOp = createMockOperation({
        id: "js:2:ethereum:0xowner:-0xsent123-OUT-i0",
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrecipient"],
        value: "500000000000000000",
        txOverrides: {
          hash: "0xsent123",
          date: "2024-01-15T10:00:00Z",
          block: { height: 19_000_001, time: "2024-01-15T10:00:00Z" },
        },
      });

      const receivedOp = createMockOperation({
        id: "js:2:ethereum:0xowner:-0xreceived456-IN-i0",
        type: "IN",
        senders: ["0xsender"],
        recipients: [testAddress],
        value: "1800000000000000000",
        txOverrides: {
          hash: "0xreceived456",
          date: "2024-01-15T11:00:00Z",
          block: { height: 19_000_002, time: "2024-01-15T11:00:00Z" },
        },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({
          items: [sentOp, receivedOp],
        } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const transactions = (
        result.extract() as { transactions: unknown[] }
      ).transactions;
      expect(transactions).toHaveLength(2);
      expect(transactions[0]).toMatchObject({
        hash: "0xsent123",
        type: "sent",
        direction: "sent",
        kind: "transfer",
        status: "confirmed",
        value: "500000000000000000",
        formattedValue: "0.5",
        currencyName: "Ethereum",
        ticker: "ETH",
        timestamp: "2024-01-15T10:00:00Z",
        ledgerId: "ethereum",
      });
      expect(transactions[1]).toMatchObject({
        hash: "0xreceived456",
        type: "received",
        direction: "received",
        kind: "transfer",
        status: "confirmed",
      });
    });

    it("should produce two distinct items for a swap (one OUT + one IN sharing tx.hash)", async () => {
      const swapOut = createMockOperation({
        id: "js:2:ethereum:0xowner:-0xswap-OUT-i0",
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrouter"],
        value: "1000000",
        asset: { type: "erc20", assetReference: "0xusdc" },
        txOverrides: { hash: "0xswap" },
      });

      const swapIn = createMockOperation({
        id: "js:2:ethereum:0xowner:-0xswap-IN-i1",
        type: "IN",
        senders: ["0xrouter"],
        recipients: [testAddress],
        value: "999313",
        asset: { type: "erc20", assetReference: "0xusdt" },
        txOverrides: { hash: "0xswap" },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({
          items: [swapOut, swapIn],
        } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const transactions = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions;
      expect(transactions).toHaveLength(2);
      expect(transactions[0].hash).toBe(transactions[1].hash);
      expect(transactions[0]).toMatchObject({ direction: "sent", value: "1000000" });
      expect(transactions[1]).toMatchObject({ direction: "received", value: "999313" });
    });
  });

  describe("fee extraction", () => {
    it("should populate fee, formattedFee and feeTicker when user is the feesPayer", async () => {
      const op = createMockOperation({
        type: "OUT",
        senders: [testAddress],
        recipients: ["0xrecipient"],
        value: "1000000000000000000",
        txOverrides: {
          fees: "21000000000000",
          feesPayer: testAddress,
          block: { height: 12345, time: "2024-01-15T10:30:00Z" },
        },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({
        fee: "21000000000000",
        formattedFee: "0.000021",
        feeTicker: "ETH",
        blockHeight: 12345,
      });
    });

    it("should not set fee fields when fee is missing or zero", async () => {
      const op = createMockOperation({
        senders: [testAddress],
        value: "1",
        txOverrides: { fees: "0" },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx.fee).toBeUndefined();
      expect(tx.formattedFee).toBeUndefined();
      expect(tx.feeTicker).toBeUndefined();
    });

    it("should not set fee fields when feesPayer is someone else", async () => {
      const op = createMockOperation({
        type: "IN",
        senders: ["0xsender"],
        recipients: [testAddress],
        value: "1",
        txOverrides: {
          fees: "21000000000000",
          feesPayer: "0xothersponsor",
        },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx.fee).toBeUndefined();
    });

    it("should still set fee fields when feesPayer is missing (back-compat)", async () => {
      const op = createMockOperation({
        type: "OUT",
        senders: [testAddress],
        value: "1",
        txOverrides: {
          fees: "21000000000000",
          feesPayer: undefined,
        },
      });

      mockDataSource.getTransactions.mockResolvedValue(
        Right({ items: [op] } satisfies AlpacaOperationsResponse),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      const tx = (
        result.extract() as { transactions: Array<Record<string, unknown>> }
      ).transactions[0];
      expect(tx).toMatchObject({
        fee: "21000000000000",
        feeTicker: "ETH",
      });
    });
  });
});
