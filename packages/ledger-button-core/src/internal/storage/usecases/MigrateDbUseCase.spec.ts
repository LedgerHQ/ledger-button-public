import {
  Curve,
  KeyPair,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EncryptKeypairUseCase } from "../../cryptographic/usecases/EncryptKeypairUseCase.js";
import type { GetEncryptionKeyUseCase } from "../../cryptographic/usecases/GetEncryptionKey.js";
import type { GetKeypairUseCase } from "../../cryptographic/usecases/GetKeypairUseCase.js";
import { StorageIDBGetError } from "../model/errors.js";
import type { StorageService } from "../StorageService.js";
import { MigrateDbUseCase } from "./MigrateDbUseCase.js";

describe("MigrateDbUseCase", () => {
  let migrateDbUseCase: MigrateDbUseCase;
  let mockLoggerFactory: ReturnType<typeof vi.fn>;
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };
  let mockStorageService: {
    getDbVersion: ReturnType<typeof vi.fn>;
    setDbVersion: ReturnType<typeof vi.fn>;
    getKeyPair: ReturnType<typeof vi.fn>;
    removeKeyPair: ReturnType<typeof vi.fn>;
    storeKeyPair: ReturnType<typeof vi.fn>;
  };
  let mockEncryptKeypairUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockGetEncryptionKeyUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockGetKeypairUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    mockLoggerFactory = vi.fn().mockReturnValue(mockLogger);

    mockStorageService = {
      getDbVersion: vi.fn(),
      setDbVersion: vi.fn(),
      getKeyPair: vi.fn(),
      removeKeyPair: vi.fn(),
      storeKeyPair: vi.fn(),
    };

    mockEncryptKeypairUseCase = {
      execute: vi.fn(),
    };

    mockGetEncryptionKeyUseCase = {
      execute: vi.fn(),
    };

    mockGetKeypairUseCase = {
      execute: vi.fn(),
    };

    migrateDbUseCase = new MigrateDbUseCase(
      mockLoggerFactory,
      mockStorageService as unknown as StorageService,
      mockEncryptKeypairUseCase as unknown as EncryptKeypairUseCase,
      mockGetEncryptionKeyUseCase as unknown as GetEncryptionKeyUseCase,
      mockGetKeypairUseCase as unknown as GetKeypairUseCase,
    );
  });

  describe("execute", () => {
    it("should not migrate when database is already at latest version", async () => {
      mockStorageService.getDbVersion.mockResolvedValue(1);

      await migrateDbUseCase.execute();

      expect(mockStorageService.getDbVersion).toHaveBeenCalledTimes(1);
      expect(mockStorageService.setDbVersion).not.toHaveBeenCalled();
      expect(mockStorageService.getKeyPair).not.toHaveBeenCalled();
    });

    it("should migrate from version 0 to version 1", async () => {
      mockStorageService.getDbVersion.mockResolvedValue(0);
      mockStorageService.getKeyPair.mockResolvedValue(
        Left(new Error("No keypair")),
      );
      mockGetKeypairUseCase.execute.mockResolvedValue({} as KeyPair);
      mockStorageService.setDbVersion.mockResolvedValue(undefined);

      await migrateDbUseCase.execute();

      expect(mockStorageService.getDbVersion).toHaveBeenCalledTimes(1);
      expect(mockStorageService.getKeyPair).toHaveBeenCalledTimes(1);
      expect(mockGetKeypairUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockStorageService.setDbVersion).toHaveBeenCalledWith(1);
    });
  });

  describe("migrateToV1", () => {
    describe("when keypair exists in storage", () => {
      it.each([
        {
          description:
            "should encrypt existing unencrypted keypair and store it",
          fillValue: 1,
          assertions: async (
            mockEncryptedKeypair: Uint8Array,
            mockEncryptionKey: CryptoKey,
          ) => {
            expect(mockStorageService.getKeyPair).toHaveBeenCalledTimes(1);
            expect(mockGetEncryptionKeyUseCase.execute).toHaveBeenCalledTimes(
              1,
            );
            expect(mockEncryptKeypairUseCase.execute).toHaveBeenCalledTimes(1);

            const encryptCall = mockEncryptKeypairUseCase.execute.mock.calls[0];
            expect(encryptCall[0]).toBeDefined();
            expect(encryptCall[0].getPublicKeyToHex).toBeDefined(); // KeyPair has this method
            expect(encryptCall[1]).toBe(mockEncryptionKey);

            expect(mockStorageService.removeKeyPair).toHaveBeenCalledTimes(1);
            expect(mockStorageService.storeKeyPair).toHaveBeenCalledWith(
              mockEncryptedKeypair,
            );
            expect(mockStorageService.setDbVersion).toHaveBeenCalledWith(1);
          },
        },
        {
          description:
            "should import keypair using NobleCryptoService with K256 curve",
          fillValue: 2,
          setup: () => {
            return vi.spyOn(NobleCryptoService.prototype, "importKeyPair");
          },
          assertions: async (
            _mockEncryptedKeypair: Uint8Array,
            _mockEncryptionKey: CryptoKey,
            mockKeypairBuffer: Uint8Array,
            importSpy?: unknown,
          ) => {
            expect(importSpy).toHaveBeenCalledWith(
              mockKeypairBuffer,
              Curve.K256,
            );
          },
        },
      ])("$description", async ({ fillValue, setup, assertions }) => {
        const mockKeypairBuffer = new Uint8Array(32).fill(fillValue);
        const mockEncryptedKeypair = new Uint8Array([5, 6, 7, 8]);
        const mockEncryptionKey = {} as CryptoKey;

        mockStorageService.getDbVersion.mockResolvedValue(0);
        mockStorageService.getKeyPair.mockResolvedValue(
          Right(mockKeypairBuffer),
        );
        mockGetEncryptionKeyUseCase.execute.mockResolvedValue(
          mockEncryptionKey,
        );
        mockEncryptKeypairUseCase.execute.mockResolvedValue(
          mockEncryptedKeypair,
        );
        mockStorageService.removeKeyPair.mockResolvedValue(undefined);
        mockStorageService.storeKeyPair.mockResolvedValue(Right(true));
        mockStorageService.setDbVersion.mockResolvedValue(undefined);

        const spy = setup?.();

        await migrateDbUseCase.execute();

        await assertions(
          mockEncryptedKeypair,
          mockEncryptionKey,
          mockKeypairBuffer,
          spy,
        );
      });

      it("should remove old unencrypted keypair before storing encrypted one", async () => {
        const mockKeypairBuffer = new Uint8Array(32).fill(3);
        const mockEncryptedKeypair = new Uint8Array([5, 6, 7, 8]);
        const mockEncryptionKey = {} as CryptoKey;

        const callOrder: string[] = [];

        mockStorageService.getDbVersion.mockResolvedValue(0);
        mockStorageService.getKeyPair.mockResolvedValue(
          Right(mockKeypairBuffer),
        );
        mockGetEncryptionKeyUseCase.execute.mockResolvedValue(
          mockEncryptionKey,
        );
        mockEncryptKeypairUseCase.execute.mockResolvedValue(
          mockEncryptedKeypair,
        );
        mockStorageService.removeKeyPair.mockImplementation(() => {
          callOrder.push("remove");
          return Promise.resolve(undefined);
        });
        mockStorageService.storeKeyPair.mockImplementation(() => {
          callOrder.push("store");
          return Promise.resolve(Right(true));
        });
        mockStorageService.setDbVersion.mockResolvedValue(undefined);

        await migrateDbUseCase.execute();

        expect(callOrder).toEqual(["remove", "store"]);
      });
    });

    describe("when keypair does not exist in storage", () => {
      it("should generate a new keypair when no keypair exists", async () => {
        const mockNewKeypair = {} as KeyPair;

        mockStorageService.getDbVersion.mockResolvedValue(0);
        mockStorageService.getKeyPair.mockResolvedValue(
          Left(new Error("No keypair found")),
        );
        mockGetKeypairUseCase.execute.mockResolvedValue(mockNewKeypair);
        mockStorageService.setDbVersion.mockResolvedValue(undefined);

        await migrateDbUseCase.execute();

        expect(mockStorageService.getKeyPair).toHaveBeenCalledTimes(1);
        expect(mockGetKeypairUseCase.execute).toHaveBeenCalledTimes(1);
        expect(mockEncryptKeypairUseCase.execute).not.toHaveBeenCalled();
        expect(mockStorageService.removeKeyPair).not.toHaveBeenCalled();
        expect(mockStorageService.setDbVersion).toHaveBeenCalledWith(1);
        expect(mockStorageService.storeKeyPair).not.toHaveBeenCalled();
      });
    });

    describe("error scenarios", () => {
      it.each([
        {
          description: "should handle errors when getting encryption key fails",
          fillValue: 5,
          hasKeypair: true,
          setupMocks: (mocks: {
            mockKeypairBuffer: Uint8Array;
            mockEncryptionKey: CryptoKey;
            mockEncryptedKeypair: Uint8Array;
          }) => {
            const encryptionKeyError = new StorageIDBGetError(
              "Failed to get encryption key",
            );
            mockStorageService.getKeyPair.mockResolvedValue(
              Right(mocks.mockKeypairBuffer),
            );
            mockGetEncryptionKeyUseCase.execute.mockRejectedValue(
              encryptionKeyError,
            );
          },
          expectedError: StorageIDBGetError,
          expectedErrorMessage: undefined,
          assertions: () => {
            expect(mockEncryptKeypairUseCase.execute).not.toHaveBeenCalled();
            expect(mockStorageService.storeKeyPair).not.toHaveBeenCalled();
          },
        },
        {
          description: "should handle errors when encrypting keypair fails",
          fillValue: 6,
          hasKeypair: true,
          setupMocks: (mocks: {
            mockKeypairBuffer: Uint8Array;
            mockEncryptionKey: CryptoKey;
            mockEncryptedKeypair: Uint8Array;
          }) => {
            const encryptionError = new Error("Encryption failed");
            mockStorageService.getKeyPair.mockResolvedValue(
              Right(mocks.mockKeypairBuffer),
            );
            mockGetEncryptionKeyUseCase.execute.mockResolvedValue(
              mocks.mockEncryptionKey,
            );
            mockEncryptKeypairUseCase.execute.mockRejectedValue(
              encryptionError,
            );
          },
          expectedError: Error,
          expectedErrorMessage: "Encryption failed",
          assertions: () => {
            expect(mockStorageService.removeKeyPair).not.toHaveBeenCalled();
            expect(mockStorageService.storeKeyPair).not.toHaveBeenCalled();
          },
        },
        {
          description:
            "should handle errors when storing encrypted keypair fails",
          fillValue: 7,
          hasKeypair: true,
          setupMocks: (mocks: {
            mockKeypairBuffer: Uint8Array;
            mockEncryptionKey: CryptoKey;
            mockEncryptedKeypair: Uint8Array;
          }) => {
            const storageError = new Error("Storage failed");
            mockStorageService.getKeyPair.mockResolvedValue(
              Right(mocks.mockKeypairBuffer),
            );
            mockGetEncryptionKeyUseCase.execute.mockResolvedValue(
              mocks.mockEncryptionKey,
            );
            mockEncryptKeypairUseCase.execute.mockResolvedValue(
              mocks.mockEncryptedKeypair,
            );
            mockStorageService.removeKeyPair.mockResolvedValue(undefined);
            mockStorageService.storeKeyPair.mockRejectedValue(storageError);
          },
          expectedError: Error,
          expectedErrorMessage: "Storage failed",
          assertions: () => {
            expect(mockStorageService.setDbVersion).not.toHaveBeenCalled();
          },
        },
        {
          description: "should handle errors when generating new keypair fails",
          fillValue: 0,
          hasKeypair: false,
          setupMocks: () => {
            const keypairError = new Error("Keypair generation failed");
            mockStorageService.getKeyPair.mockResolvedValue(
              Left(new Error("No keypair")),
            );
            mockGetKeypairUseCase.execute.mockRejectedValue(keypairError);
          },
          expectedError: Error,
          expectedErrorMessage: "Keypair generation failed",
          assertions: () => {
            expect(mockStorageService.setDbVersion).not.toHaveBeenCalled();
          },
        },
        {
          description:
            "should handle errors when setting database version fails",
          fillValue: 0,
          hasKeypair: false,
          setupMocks: () => {
            const versionError = new Error("Failed to set version");
            mockStorageService.getKeyPair.mockResolvedValue(
              Left(new Error("No keypair")),
            );
            mockGetKeypairUseCase.execute.mockResolvedValue({} as KeyPair);
            mockStorageService.setDbVersion.mockRejectedValue(versionError);
          },
          expectedError: Error,
          expectedErrorMessage: "Failed to set version",
        },
      ])(
        "$description",
        async ({
          fillValue,
          setupMocks,
          expectedError,
          expectedErrorMessage,
          assertions,
        }) => {
          const mockKeypairBuffer = new Uint8Array(32).fill(fillValue);
          const mockEncryptedKeypair = new Uint8Array([5, 6, 7, 8]);
          const mockEncryptionKey = {} as CryptoKey;

          mockStorageService.getDbVersion.mockResolvedValue(0);
          setupMocks({
            mockKeypairBuffer,
            mockEncryptionKey,
            mockEncryptedKeypair,
          });

          if (expectedErrorMessage) {
            await expect(migrateDbUseCase.execute()).rejects.toThrow(
              expectedErrorMessage,
            );
          } else {
            await expect(migrateDbUseCase.execute()).rejects.toBeInstanceOf(
              expectedError,
            );
          }

          assertions?.();
        },
      );
    });
  });
});
