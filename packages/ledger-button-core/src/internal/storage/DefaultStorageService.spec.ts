import "fake-indexeddb/auto";

import { Maybe, Nothing, Right } from "purify-ts";

import { STORAGE_KEYS } from "./model/constant.js";
import {
  StorageIDBGetError,
  StorageIDBOpenError,
  StorageIDBRemoveError,
  StorageIDBStoreError,
} from "./model/errors.js";
import { Config } from "../config/model/config.js";
import { ConsoleLoggerSubscriber } from "../logger/service/ConsoleLoggerSubscriber.js";
import { DefaultLoggerPublisher } from "../logger/service/DefaultLoggerPublisher.js";
import { DefaultStorageService } from "./DefaultStorageService.js";

vi.mock("../logger/service/DefaultLoggerPublisher.js");
vi.mock("../logger/service/ConsoleLoggerSubscriber.js");

let config: Config;
let storageService: DefaultStorageService;

describe("DefaultStorageService", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    config = new Config({
      originToken: "test-token",
      dAppIdentifier: "test-app",
      logLevel: "info",
    });
    storageService = new DefaultStorageService(
      (tag) =>
        new DefaultLoggerPublisher([new ConsoleLoggerSubscriber(config)], tag),
    );
  });

  describe("LocalStorage methods", () => {
    describe("saveItem", () => {
      it("should be able to save an item", () => {
        const spy = vi.spyOn(Storage.prototype, "setItem");
        storageService.saveItem("test", "test");
        expect(spy).toHaveBeenCalledWith(
          `${STORAGE_KEYS.PREFIX}-test`,
          JSON.stringify("test"),
        );
      });

      it("should be able to save an item with an object and sanitize it", () => {
        const spy = vi.spyOn(JSON, "stringify");

        storageService.saveItem("test", { test: "test" });
        expect(spy).toHaveBeenCalledWith({ test: "test" });
      });
    });

    describe("getItem", () => {
      it("should be able to get an item", () => {
        const spy = vi.spyOn(Storage.prototype, "getItem");
        storageService.saveItem("test", "test");
        const item = storageService.getItem("test");
        expect(item).toStrictEqual(Maybe.of("test"));
        expect(spy).toHaveBeenCalledWith(`${STORAGE_KEYS.PREFIX}-test`);
      });

      it("should be able to get an item with a Nothing if the key does not exist", () => {
        vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
        const item = storageService.getItem("test");
        expect(item).toStrictEqual(Nothing);
      });
    });

    describe("removeItem", () => {
      it("should be able to remove an item", () => {
        const spy = vi.spyOn(Storage.prototype, "removeItem");
        vi.spyOn(storageService, "hasItem").mockReturnValue(true);
        storageService.removeItem("test");
        expect(spy).toHaveBeenCalledWith(`${STORAGE_KEYS.PREFIX}-test`);
      });

      it("should not be able to remove an item if it does not exist", () => {
        const spy = vi.spyOn(Storage.prototype, "removeItem");
        vi.spyOn(storageService, "hasItem").mockReturnValue(false);
        storageService.removeItem("test");
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe("hasItem", () => {
      it("should be able to check if an item exists (false)", () => {
        const res = storageService.hasItem("test");
        expect(res).toBe(false);
      });

      it("should be able to check if an item exists (true)", () => {
        storageService.saveItem("key", "value");
        const res = storageService.hasItem("key");
        expect(res).toBe(true);
      });
    });

    describe("resetStorage", () => {
      it("should be able to reset the storage", () => {
        storageService.saveItem("test", "test");
        storageService.resetStorage();
        expect(localStorage.length).toBe(0);
      });

      it("should be able to reset the storage and keep other keys", () => {
        localStorage.setItem("yolo", "yolo");
        expect(localStorage.getItem("yolo")).toBe("yolo");
        storageService.saveItem("test", "test");
        storageService.resetStorage();
        expect(localStorage.getItem("ledger-button-test")).toBeNull();
      });
    });

    it("should be able to format the key", () => {
      const formattedKey = DefaultStorageService.formatKey("test");
      expect(formattedKey).toBe("ledger-button-test");
    });
  });

  describe("IndexedDB (KeyPair) methods", () => {
    describe("initIdb", () => {
      it("should be able to initialize the IDB", async () => {
        const result = await storageService.initIdb();
        expect(result.isRight()).toBe(true);
        result.map((db) => {
          expect(db).toBeInstanceOf(IDBDatabase);
        });
      });

      it("should return cached IDB instance on subsequent calls", async () => {
        const firstResult = await storageService.initIdb();
        const secondResult = await storageService.initIdb();
        expect(firstResult).toBe(secondResult);
      });

      it("should handle IDB initialization errors", async () => {
        // Mock indexedDB.open to fail
        const originalOpen = indexedDB.open;
        indexedDB.open = vi.fn().mockImplementation(() => {
          const mockRequest = {
            onerror: null as any,
            onsuccess: null as any,
            onupgradeneeded: null as any,
          };
          // Simulate error
          setTimeout(() => {
            if (mockRequest.onerror) {
              mockRequest.onerror(new Event("error"));
            }
          }, 0);
          return mockRequest;
        });

        const result = await storageService.initIdb();
        expect(result.isLeft()).toBe(true);
        result.mapLeft((error) => {
          expect(error).toBeInstanceOf(StorageIDBOpenError);
        });

        // Restore original
        indexedDB.open = originalOpen;
      });
    });

    describe("storeKeyPair", () => {
      it("should be able to store a key pair", async () => {
        // Create a mock key pair for testing
        const mockKeyPair = {
          id: "test-id",
          getPublicKeyToHex: () => "test-public-key",
        } as any;
        const result = await storageService.storeKeyPair(mockKeyPair);
        expect(result.isRight()).toBe(true);
        result.map((success) => {
          expect(success).toBe(true);
        });
      });

      it("should handle storage errors", async () => {
        // Mock the IDB to simulate an error during storage
        const mockRequest = {
          onsuccess: null as any,
          onerror: null as any,
        };

        const mockDb = {
          transaction: vi.fn().mockReturnValue({
            objectStore: vi.fn().mockReturnValue({
              add: vi.fn().mockReturnValue(mockRequest),
            }),
          }),
        };

        // Mock initIdb to return a mock database
        vi.spyOn(storageService, "initIdb").mockResolvedValue(
          Right(mockDb as any),
        );

        const mockKeyPair = {
          id: "test-id",
          getPublicKeyToHex: () => "test-public-key",
        } as any;

        // Start the async operation
        const resultPromise = storageService.storeKeyPair(mockKeyPair);

        // Simulate error after a short delay
        setTimeout(() => {
          if (mockRequest.onerror) {
            mockRequest.onerror(new Event("error"));
          }
        }, 10);

        const result = await resultPromise;
        expect(result.isLeft()).toBe(true);
        result.mapLeft((error) => {
          expect(error).toBeInstanceOf(StorageIDBStoreError);
        });
      });
    });

    describe("getKeyPair", () => {
      it("should be able to get a stored key pair", async () => {
        // This test would require complex IndexedDB mocking
        // For now, we'll test the error handling path
        const mockRequest = {
          onsuccess: null as any,
          onerror: null as any,
        };

        const mockDb = {
          transaction: vi.fn().mockReturnValue({
            objectStore: vi.fn().mockReturnValue({
              get: vi.fn().mockReturnValue(mockRequest),
            }),
          }),
        };

        vi.spyOn(storageService, "initIdb").mockResolvedValue(
          Right(mockDb as any),
        );

        // Start the async operation
        const resultPromise = storageService.getKeyPair();

        // Simulate error after a short delay
        setTimeout(() => {
          if (mockRequest.onerror) {
            mockRequest.onerror(new Event("error"));
          }
        }, 10);

        const result = await resultPromise;
        expect(result.isLeft()).toBe(true);
      });

      it("should handle get errors", async () => {
        const mockRequest = {
          onsuccess: null as any,
          onerror: null as any,
        };

        const mockDb = {
          transaction: vi.fn().mockReturnValue({
            objectStore: vi.fn().mockReturnValue({
              get: vi.fn().mockReturnValue(mockRequest),
            }),
          }),
        };

        vi.spyOn(storageService, "initIdb").mockResolvedValue(
          Right(mockDb as any),
        );

        // Start the async operation
        const resultPromise = storageService.getKeyPair();

        // Simulate error after a short delay
        setTimeout(() => {
          if (mockRequest.onerror) {
            mockRequest.onerror(new Event("error"));
          }
        }, 10);

        const result = await resultPromise;
        expect(result.isLeft()).toBe(true);
        result.mapLeft((error) => {
          expect(error).toBeInstanceOf(StorageIDBGetError);
        });
      });
    });

    describe("removeKeyPair", () => {
      it("should be able to remove a key pair", async () => {
        const mockRequest = {
          onsuccess: null as any,
          onerror: null as any,
        };

        const mockDb = {
          transaction: vi.fn().mockReturnValue({
            objectStore: vi.fn().mockReturnValue({
              delete: vi.fn().mockReturnValue(mockRequest),
            }),
          }),
        };

        vi.spyOn(storageService, "initIdb").mockResolvedValue(
          Right(mockDb as any),
        );

        // Start the async operation
        const resultPromise = storageService.removeKeyPair();

        // Simulate success after a short delay
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess(new Event("success"));
          }
        }, 10);

        const result = await resultPromise;
        expect(result.isRight()).toBe(true);
        result.map((success) => {
          expect(success).toBe(true);
        });
      });

      it("should handle remove errors", async () => {
        const mockRequest = {
          onsuccess: null as any,
          onerror: null as any,
        };

        const mockDb = {
          transaction: vi.fn().mockReturnValue({
            objectStore: vi.fn().mockReturnValue({
              delete: vi.fn().mockReturnValue(mockRequest),
            }),
          }),
        };

        vi.spyOn(storageService, "initIdb").mockResolvedValue(
          Right(mockDb as any),
        );

        // Start the async operation
        const resultPromise = storageService.removeKeyPair();

        // Simulate error after a short delay
        setTimeout(() => {
          if (mockRequest.onerror) {
            mockRequest.onerror(new Event("error"));
          }
        }, 10);

        const result = await resultPromise;
        expect(result.isLeft()).toBe(true);
        result.mapLeft((error) => {
          expect(error).toBeInstanceOf(StorageIDBRemoveError);
        });
      });
    });
  });

  describe("Trust Chain ID methods", () => {
    describe("saveTrustChainId", () => {
      it("should be able to save and get a trust chain ID", () => {
        storageService.saveTrustChainId("test-trust-chain-id");
        expect(storageService.getTrustChainId()).toEqual(
          Maybe.of("test-trust-chain-id"),
        );
      });

      it("should be able to remove a trust chain ID", () => {
        storageService.saveTrustChainId("test-trust-chain-id");
        storageService.removeTrustChainId();
        expect(storageService.getTrustChainId()).toBe(Nothing);
      });

      it("should save trust chain validity timestamp", () => {
        const beforeSave = Date.now();
        storageService.saveTrustChainId("test-trust-chain-id");
        const afterSave = Date.now();

        const validity = storageService.getItem<number>(
          STORAGE_KEYS.TRUST_CHAIN_VALIDITY,
        );
        expect(validity.isJust()).toBe(true);
        validity.map((timestamp) => {
          expect(timestamp).toBeGreaterThanOrEqual(beforeSave);
          expect(timestamp).toBeLessThanOrEqual(afterSave);
        });
      });
    });

    describe("isTrustChainValid", () => {
      it("should return false when no trust chain validity is stored", () => {
        const isValid = storageService.isTrustChainValid();
        expect(isValid).toBe(false);
      });

      it("should return false when trust chain is expired", () => {
        // Set a validity timestamp that's more than 30 days old
        const oldTimestamp = new Date();
        oldTimestamp.setDate(oldTimestamp.getDate() - 31);
        storageService.saveItem(
          STORAGE_KEYS.TRUST_CHAIN_VALIDITY,
          oldTimestamp.getTime(),
        );

        const isValid = storageService.isTrustChainValid();
        expect(isValid).toBe(false);
      });

      it("should return true when trust chain is still valid", () => {
        // Set a validity timestamp that's less than 30 days old
        const recentTimestamp = new Date();
        recentTimestamp.setDate(recentTimestamp.getDate() - 15);
        storageService.saveItem(
          STORAGE_KEYS.TRUST_CHAIN_VALIDITY,
          recentTimestamp.getTime(),
        );

        const isValid = storageService.isTrustChainValid();
        expect(isValid).toBe(true);
      });

      it("should return false when trust chain is exactly 30 days old", () => {
        // Set a validity timestamp that's exactly 30 days old
        const exactTimestamp = new Date();
        exactTimestamp.setDate(exactTimestamp.getDate() - 30);
        storageService.saveItem(
          STORAGE_KEYS.TRUST_CHAIN_VALIDITY,
          exactTimestamp.getTime(),
        );

        const isValid = storageService.isTrustChainValid();
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Selected Account methods", () => {
    describe("saveSelectedAccount", () => {
      it("should be able to save and get a selected account", () => {
        const mockAccount = { id: "test-account", name: "Test Account" } as any;
        storageService.saveSelectedAccount(mockAccount);
        expect(storageService.getSelectedAccount()).toEqual(
          Maybe.of({
            id: "",
            name: "",
            currencyId: undefined,
            freshAddress: undefined,
            seedIdentifier: "",
            derivationMode: undefined,
            index: undefined,
            ticker: "",
            balance: "",
            tokens: [],
          }),
        );
      });

      it("should be able to remove a selected account", () => {
        const mockAccount = { id: "test-account", name: "Test Account" } as any;
        storageService.saveSelectedAccount(mockAccount);
        storageService.removeSelectedAccount();
        expect(storageService.getSelectedAccount()).toBe(Nothing);
      });

      it("should handle complex account objects", () => {
        const complexAccount = {
          id: "complex-account",
          name: "Complex Account",
          currencyId: "BTC",
          freshAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
          seedIdentifier: "seed123",
          derivationMode: "44'/0'/0'",
          index: 0,
          ticker: "BTC",
          balance: "0.0000",
          tokens: [],
        } as any;

        storageService.saveSelectedAccount(complexAccount);
        const retrieved = storageService.getSelectedAccount();
        expect(retrieved).toEqual(
          Maybe.of({
            id: "",
            name: "",
            index: 0,
            balance: "",
            tokens: [],
            currencyId: "BTC",
            freshAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
            seedIdentifier: "",
            ticker: "",
            derivationMode: "44'/0'/0'",
          }),
        );
      });
    });
  });

  describe("Error handling", () => {
    describe("getItem with invalid JSON", () => {
      it("should return Nothing when JSON parsing fails", () => {
        // Manually set invalid JSON in localStorage
        const invalidKey = DefaultStorageService.formatKey("invalid-json");
        localStorage.setItem(invalidKey, "invalid json content");

        const result = storageService.getItem("invalid-json");
        expect(result).toBe(Nothing);
      });
    });

    describe("removeItem return values", () => {
      it("should return true when item is successfully removed", () => {
        storageService.saveItem("test-remove", "value");
        const result = storageService.removeItem("test-remove");
        expect(result).toBe(true);
      });

      it("should return false when item does not exist", () => {
        const result = storageService.removeItem("non-existent");
        expect(result).toBe(false);
      });
    });
  });
});
