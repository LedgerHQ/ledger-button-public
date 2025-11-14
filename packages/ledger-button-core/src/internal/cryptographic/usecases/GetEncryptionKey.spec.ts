import { Just, Nothing } from "purify-ts";

import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { StorageService } from "../../storage/StorageService.js";
import { GetEncryptionKeyUseCase } from "./GetEncryptionKey.js";

describe("GetEncryptionKeyUseCase", () => {
  let useCase: GetEncryptionKeyUseCase;
  let mockLogger: LoggerPublisher;
  let mockStorageService: StorageService;
  let mockCryptoSubtle: SubtleCrypto;
  let mockEncryptionKey: CryptoKey;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    } as unknown as LoggerPublisher;

    mockEncryptionKey = { type: "secret" } as CryptoKey;

    mockStorageService = {
      getEncryptionKey: vi.fn(),
      storeEncryptionKey: vi.fn(),
    } as unknown as StorageService;

    mockCryptoSubtle = {
      generateKey: vi.fn().mockResolvedValue(mockEncryptionKey),
    } as unknown as SubtleCrypto;

    global.window = {
      crypto: {
        subtle: mockCryptoSubtle,
      },
    } as unknown as Window & typeof globalThis;

    useCase = new GetEncryptionKeyUseCase(
      () => mockLogger,
      mockStorageService,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("execute", () => {
    describe.each([
      {
        scenario: "should return existing encryption key when found in storage",
        getStorageResult: () => Just(mockEncryptionKey),
        shouldGenerateKey: false,
        shouldStoreKey: false,
      },
      {
        scenario: "should generate new key when encryption key is not found",
        getStorageResult: () => Nothing,
        shouldGenerateKey: true,
        shouldStoreKey: true,
      },
      {
        scenario:
          "should generate new key when extracted encryption key is undefined",
        getStorageResult: () => Just(undefined as unknown as CryptoKey),
        shouldGenerateKey: true,
        shouldStoreKey: true,
      },
    ])(
      "$scenario",
      ({ getStorageResult, shouldGenerateKey, shouldStoreKey }) => {
        beforeEach(() => {
          vi.clearAllMocks();
          vi.mocked(mockStorageService.getEncryptionKey).mockResolvedValue(
            getStorageResult(),
          );
        });

        it("should return encryption key", async () => {
          const result = await useCase.execute();
          expect(result).toBe(mockEncryptionKey);
        });

        it("should handle key generation and storage correctly", async () => {
          await useCase.execute();

          expect(mockStorageService.getEncryptionKey).toHaveBeenCalled();

          if (shouldGenerateKey) {
            expect(mockCryptoSubtle.generateKey).toHaveBeenCalledWith(
              {
                name: "AES-GCM",
                length: 256,
              },
              false,
              ["encrypt", "decrypt"],
            );
          } else {
            expect(mockCryptoSubtle.generateKey).not.toHaveBeenCalled();
          }

          if (shouldStoreKey) {
            expect(mockStorageService.storeEncryptionKey).toHaveBeenCalledWith(
              mockEncryptionKey,
            );
          } else {
            expect(mockStorageService.storeEncryptionKey).not.toHaveBeenCalled();
          }
        });
      },
    );
  });

  describe("storeEncryptionKey", () => {
    it("should store encryption key successfully", async () => {
      await expect(
        useCase.storeEncryptionKey(mockEncryptionKey),
      ).resolves.toBeUndefined();

      expect(mockStorageService.storeEncryptionKey).toHaveBeenCalledWith(
        mockEncryptionKey,
      );
    });

    it("should reject with error when storage fails", async () => {
      const error = new Error("Storage error");
      vi.mocked(mockStorageService.storeEncryptionKey).mockImplementation(
        () => {
          throw error;
        },
      );

      await expect(
        useCase.storeEncryptionKey(mockEncryptionKey),
      ).rejects.toThrow(error);
    });
  });

  describe("generateAndStoreEncryptionKey", () => {
    it("should generate and store new encryption key", async () => {
      const result = await useCase.generateAndStoreEncryptionKey();

      expect(result).toBe(mockEncryptionKey);
      expect(mockCryptoSubtle.generateKey).toHaveBeenCalledWith(
        {
          name: "AES-GCM",
          length: 256,
        },
        false,
        ["encrypt", "decrypt"],
      );
      expect(mockStorageService.storeEncryptionKey).toHaveBeenCalledWith(
        mockEncryptionKey,
      );
    });
  });
});
