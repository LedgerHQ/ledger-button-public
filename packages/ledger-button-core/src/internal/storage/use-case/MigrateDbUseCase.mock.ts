import { Nothing, Right } from "purify-ts";
import { type Mock, vi } from "vitest";

import type { StorageService } from "../StorageService";
import type { KeyPairMigrationService } from "./KeypairMigrationService";
import { MigrateDbUseCase } from "./MigrateDbUseCase";

export const mockKeyPairBuffer = new Uint8Array([1, 2, 3]);

export const createMockStorageService = (): {
  getDbVersion: Mock;
  setDbVersion: Mock;
  getItem: Mock;
  saveItem: Mock;
  removeItem: Mock;
  getKeyPair: Mock;
} => ({
  getDbVersion: vi.fn(),
  setDbVersion: vi.fn().mockResolvedValue(Right(undefined)),
  getItem: vi.fn().mockReturnValue(Nothing),
  saveItem: vi.fn(),
  removeItem: vi.fn(),
  getKeyPair: vi.fn().mockResolvedValue(Right(mockKeyPairBuffer)),
});

export const createMockLogger = (): { info: Mock } => ({
  info: vi.fn(),
});

export const createMockLoggerFactory = (
  mockLogger: ReturnType<typeof createMockLogger>,
): Mock => vi.fn().mockReturnValue(mockLogger);

export const createMockKeyPairMigrationService = (): {
  migrateKeyPairToEncrypted: Mock;
} => ({
  migrateKeyPairToEncrypted: vi.fn().mockResolvedValue(undefined),
});

export const createMigrateDbUseCase = (
  mockStorageService: ReturnType<typeof createMockStorageService>,
  mockLoggerFactory: ReturnType<typeof createMockLoggerFactory>,
  mockKeyPairMigrationService: ReturnType<
    typeof createMockKeyPairMigrationService
  >,
) => {
  return new MigrateDbUseCase(
    mockLoggerFactory,
    mockStorageService as unknown as StorageService,
    mockKeyPairMigrationService as unknown as KeyPairMigrationService,
  );
};
