import { Right } from "purify-ts";
import { vi } from "vitest";

import type { EncryptKeypairUseCase } from "../../../cryptographic/usecases/EncryptKeypairUseCase.js";
import type { GetEncryptionKeyUseCase } from "../../../cryptographic/usecases/GetEncryptionKey.js";
import type { GetKeypairUseCase } from "../../../cryptographic/usecases/GetKeypairUseCase.js";
import type { StorageService } from "../../StorageService.js";
import { KeyPairMigrationService } from "./KeypairMigrationService.js";
import { MigrateDbUseCase } from "./MigrateDbUseCase.js";

export const mockKeyPairBuffer = new Uint8Array([1, 2, 3]);

export const createMockStorageService = () => ({
  getDbVersion: vi.fn(),
  setDbVersion: vi.fn(),
  getKeyPair: vi.fn().mockResolvedValue(Right(mockKeyPairBuffer)),
});

export const createMockLogger = () => ({
  info: vi.fn(),
});

export const createMockLoggerFactory = (
  mockLogger: ReturnType<typeof createMockLogger>,
) => vi.fn().mockReturnValue(mockLogger);

export const createMockKeyPairMigrationService = () => ({
  migrateKeyPairToEncrypted: vi.fn().mockResolvedValue(undefined),
});

export const setupKeyPairMigrationServiceMock = (
  mockKeyPairMigrationService: ReturnType<
    typeof createMockKeyPairMigrationService
  >,
) => {
  vi.mocked(KeyPairMigrationService).mockImplementation(() => {
    return mockKeyPairMigrationService as unknown as KeyPairMigrationService;
  });
};

export const createMigrateDbUseCase = (
  mockStorageService: ReturnType<typeof createMockStorageService>,
  mockLoggerFactory: ReturnType<typeof createMockLoggerFactory>,
) => {
  return new MigrateDbUseCase(
    mockLoggerFactory,
    mockStorageService as unknown as StorageService,
    {} as EncryptKeypairUseCase,
    {} as GetEncryptionKeyUseCase,
    {} as GetKeypairUseCase,
  );
};

