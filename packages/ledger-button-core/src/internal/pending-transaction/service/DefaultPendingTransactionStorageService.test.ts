import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PendingTransaction } from "../model/PendingTransaction.js";
import { DefaultPendingTransactionStorageService } from "./DefaultPendingTransactionStorageService.js";

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

describe("DefaultPendingTransactionStorageService", () => {
  let service: DefaultPendingTransactionStorageService;
  let mockSessionStorage: Record<string, string>;

  beforeEach(() => {
    mockSessionStorage = {};
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockSessionStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockSessionStorage[key];
      }),
    });

    service = new DefaultPendingTransactionStorageService(
      createMockLoggerFactory(),
    );
  });

  describe("getAll", () => {
    it("should return empty array when storage is empty", () => {
      expect(service.getAll()).toEqual([]);
    });

    it("should return parsed transactions from storage", () => {
      const tx = createPendingTx();
      mockSessionStorage["ledger-button:pending-txs"] = JSON.stringify([tx]);

      expect(service.getAll()).toEqual([tx]);
    });

    it("should return empty array on corrupted JSON", () => {
      mockSessionStorage["ledger-button:pending-txs"] = "not-valid-json";

      expect(service.getAll()).toEqual([]);
    });
  });

  describe("add", () => {
    it("should add a transaction to storage", () => {
      const tx = createPendingTx();
      service.add(tx);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        "ledger-button:pending-txs",
        JSON.stringify([tx]),
      );
    });

    it("should append to existing transactions", () => {
      const tx1 = createPendingTx({ hash: "0x111" });
      const tx2 = createPendingTx({ hash: "0x222" });
      mockSessionStorage["ledger-button:pending-txs"] = JSON.stringify([tx1]);

      service.add(tx2);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        "ledger-button:pending-txs",
        JSON.stringify([tx1, tx2]),
      );
    });

    it("should not add duplicate hashes", () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockSessionStorage["ledger-button:pending-txs"] = JSON.stringify([tx]);

      service.add(tx);

      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should replace an existing transaction by hash", () => {
      const original = createPendingTx({ hash: "0x111", ticker: "ETHEREUM" });
      const updated = createPendingTx({
        hash: "0x111",
        ticker: "ETH",
        currencyName: "Ethereum",
      });
      mockSessionStorage["ledger-button:pending-txs"] = JSON.stringify([
        original,
      ]);

      service.update(updated);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        "ledger-button:pending-txs",
        JSON.stringify([updated]),
      );
    });

    it("should noop when transaction does not exist", () => {
      const updated = createPendingTx({ hash: "0xmissing" });

      service.update(updated);

      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it("should preserve order when updating one transaction among many", () => {
      const tx1 = createPendingTx({ hash: "0x111" });
      const tx2 = createPendingTx({ hash: "0x222", ticker: "ETHEREUM" });
      const tx3 = createPendingTx({ hash: "0x333" });
      mockSessionStorage["ledger-button:pending-txs"] = JSON.stringify([
        tx1,
        tx2,
        tx3,
      ]);

      const updatedTx2 = createPendingTx({ hash: "0x222", ticker: "ETH" });
      service.update(updatedTx2);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        "ledger-button:pending-txs",
        JSON.stringify([tx1, updatedTx2, tx3]),
      );
    });
  });

  describe("remove", () => {
    it("should remove a transaction by hash", () => {
      const tx1 = createPendingTx({ hash: "0x111" });
      const tx2 = createPendingTx({ hash: "0x222" });
      mockSessionStorage["ledger-button:pending-txs"] = JSON.stringify([
        tx1,
        tx2,
      ]);

      service.remove("0x111");

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        "ledger-button:pending-txs",
        JSON.stringify([tx2]),
      );
    });

    it("should clear storage key when last transaction is removed", () => {
      const tx = createPendingTx({ hash: "0x111" });
      mockSessionStorage["ledger-button:pending-txs"] = JSON.stringify([tx]);

      service.remove("0x111");

      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        "ledger-button:pending-txs",
      );
    });
  });
});
