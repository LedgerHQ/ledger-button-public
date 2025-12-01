import "fake-indexeddb/auto";

import { Nothing } from "purify-ts";

import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { STORAGE_KEYS } from "../model/constant.js";
import { StorageIDBGetError, StorageIDBOpenError } from "../model/errors.js";
import { DefaultIndexedDbService } from "./DefaultIndexedDbService.js";

let indexedDbService: DefaultIndexedDbService;
let mockLogger: LoggerPublisher;

const clearIndexedDB = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(STORAGE_KEYS.DB_NAME);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error);
    deleteRequest.onblocked = () => resolve();
  });
};

const clearObjectStore = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(STORAGE_KEYS.DB_NAME, 3);
    openRequest.onsuccess = () => {
      const db = openRequest.result;
      const transaction = db.transaction(
        STORAGE_KEYS.DB_STORE_NAME,
        "readwrite",
      );
      const store = transaction.objectStore(STORAGE_KEYS.DB_STORE_NAME);
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        db.close();
        resolve();
      };
      clearRequest.onerror = () => {
        db.close();
        reject(clearRequest.error);
      };
    };
    openRequest.onerror = () => reject(openRequest.error);
    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains(STORAGE_KEYS.DB_STORE_NAME)) {
        db.createObjectStore(STORAGE_KEYS.DB_STORE_NAME);
      }
    };
  });
};

describe("DefaultIndexedDbService", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await clearIndexedDB();

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    } as unknown as LoggerPublisher;

    indexedDbService = new DefaultIndexedDbService(() => mockLogger);
  });

  afterEach(async () => {
    await clearIndexedDB();
  });

  describe("initIdb", () => {
    it("should be able to initialize the IDB", async () => {
      const result = await indexedDbService.initIdb();
      expect(result.isRight()).toBe(true);
      result.map((db) => {
        expect(db).toBeInstanceOf(IDBDatabase);
      });
    });

    it("should return cached IDB instance on subsequent calls", async () => {
      const firstResult = await indexedDbService.initIdb();
      const secondResult = await indexedDbService.initIdb();
      expect(firstResult).toBe(secondResult);
    });

    it("should handle IDB initialization errors", async () => {
      const originalOpen = indexedDB.open;
      indexedDB.open = vi.fn().mockImplementation(() => {
        const mockRequest = {
          onerror: null as ((event: Event) => void) | null,
          onsuccess: null as ((event: Event) => void) | null,
          onupgradeneeded: null as ((event: Event) => void) | null,
        };
        setTimeout(() => {
          if (mockRequest.onerror) {
            mockRequest.onerror(new Event("error"));
          }
        }, 0);
        return mockRequest;
      });

      const result = await indexedDbService.initIdb();
      expect(result.isLeft()).toBe(true);
      result.mapLeft((error) => {
        expect(error).toBeInstanceOf(StorageIDBOpenError);
      });

      indexedDB.open = originalOpen;
    });
  });

  describe("storeKeyPair", () => {
    it("should be able to store a key pair", async () => {
      const mockKeyPair = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await indexedDbService.storeKeyPair(mockKeyPair);
      expect(result.isRight()).toBe(true);
      result.map((success) => {
        expect(success).toBe(true);
      });
    });
  });

  describe("getKeyPair", () => {
    it("should be able to get a stored key pair", async () => {
      const mockKeyPair = new Uint8Array([1, 2, 3, 4, 5]);
      await indexedDbService.storeKeyPair(mockKeyPair);

      const result = await indexedDbService.getKeyPair();
      expect(result.isRight()).toBe(true);
      result.map((retrievedKeyPair) => {
        expect(retrievedKeyPair).toEqual(mockKeyPair);
      });
    });
  });

  describe("getKeyPair - empty database", () => {
    beforeEach(async () => {
      await clearObjectStore();
      indexedDbService = new DefaultIndexedDbService(() => mockLogger);
    });

    it("should return error when key pair does not exist", async () => {
      const result = await indexedDbService.getKeyPair();
      expect(result.isLeft()).toBe(true);
      result.mapLeft((error) => {
        expect(error).toBeInstanceOf(StorageIDBGetError);
      });
    });
  });

  describe("removeKeyPair", () => {
    it("should be able to remove a key pair", async () => {
      const mockKeyPair = new Uint8Array([1, 2, 3, 4, 5]);
      await indexedDbService.storeKeyPair(mockKeyPair);

      const result = await indexedDbService.removeKeyPair();
      expect(result.isRight()).toBe(true);
      result.map((success) => {
        expect(success).toBe(true);
      });

      const getResult = await indexedDbService.getKeyPair();
      expect(getResult.isLeft()).toBe(true);
    });
  });

  describe("storeEncryptionKey", () => {
    it("should be able to store an encryption key", async () => {
      const mockKey = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"],
      );

      await expect(
        indexedDbService.storeEncryptionKey(mockKey),
      ).resolves.not.toThrow();
    });
  });

  describe("getEncryptionKey", () => {
    it("should be able to get a stored encryption key", async () => {
      const mockKey = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"],
      );

      await indexedDbService.storeEncryptionKey(mockKey);

      const result = await indexedDbService.getEncryptionKey();
      expect(result.isJust()).toBe(true);
      result.map((retrievedKey) => {
        expect(retrievedKey).toBeInstanceOf(CryptoKey);
      });
    });
  });

  describe("getEncryptionKey - empty database", () => {
    beforeEach(async () => {
      await clearObjectStore();
      indexedDbService = new DefaultIndexedDbService(() => mockLogger);
    });

    it("should return Nothing when encryption key does not exist", async () => {
      const result = await indexedDbService.getEncryptionKey();
      expect(result).toBe(Nothing);
    });
  });
});
