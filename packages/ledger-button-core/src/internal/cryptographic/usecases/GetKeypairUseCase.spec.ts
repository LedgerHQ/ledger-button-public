import { bufferToHexaString } from "@ledgerhq/device-management-kit";
import {
  Curve,
  KeyPair,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { Left, Right } from "purify-ts";

import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { StorageIDBGetError } from "../../storage/model/errors.js";
import { StorageService } from "../../storage/StorageService.js";
import { DecryptKeypairUseCase } from "./DecryptKeypairUseCase.js";
import { EncryptKeypairUseCase } from "./EncryptKeypairUseCase.js";
import { GenerateKeypairUseCase } from "./GenerateKeypairUseCase.js";
import { GetEncryptionKeyUseCase } from "./GetEncryptionKey.js";
import { GetKeypairUseCase } from "./GetKeypairUseCase.js";

vi.mock("@ledgerhq/device-management-kit");
vi.mock("@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol");

describe("GetKeypairUseCase", () => {
  let useCase: GetKeypairUseCase;
  let mockLogger: LoggerPublisher;
  let mockStorageService: StorageService;
  let mockGenerateKeypairUseCase: GenerateKeypairUseCase;
  let mockGetEncryptionKeyUseCase: GetEncryptionKeyUseCase;
  let mockEncryptKeypairUseCase: EncryptKeypairUseCase;
  let mockDecryptKeypairUseCase: DecryptKeypairUseCase;
  let mockCryptoService: NobleCryptoService;
  let mockKeyPair: KeyPair;
  let mockEncryptionKey: CryptoKey;

  const mockEncryptedKeypair = new Uint8Array([1, 2, 3, 4, 5]);
  const mockDecryptedKeypair = new Uint8Array([6, 7, 8, 9, 10]);

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    } as unknown as LoggerPublisher;

    mockKeyPair = {
      id: "test-keypair-id",
      getPublicKeyToHex: vi.fn().mockReturnValue("mock-public-key"),
    } as unknown as KeyPair;

    mockEncryptionKey = { type: "secret" } as CryptoKey;

    mockStorageService = {
      getKeyPair: vi.fn(),
      storeKeyPair: vi.fn(),
    } as unknown as StorageService;

    mockGenerateKeypairUseCase = {
      execute: vi.fn().mockResolvedValue(mockKeyPair),
    } as unknown as GenerateKeypairUseCase;

    mockGetEncryptionKeyUseCase = {
      execute: vi.fn().mockResolvedValue(mockEncryptionKey),
    } as unknown as GetEncryptionKeyUseCase;

    mockEncryptKeypairUseCase = {
      execute: vi.fn().mockResolvedValue(mockEncryptedKeypair),
    } as unknown as EncryptKeypairUseCase;

    mockDecryptKeypairUseCase = {
      execute: vi.fn().mockResolvedValue(mockDecryptedKeypair),
    } as unknown as DecryptKeypairUseCase;

    mockCryptoService = {
      importKeyPair: vi.fn().mockReturnValue(mockKeyPair),
    } as unknown as NobleCryptoService;

    vi.mocked(NobleCryptoService).mockImplementation(() => mockCryptoService);
    vi.mocked(bufferToHexaString).mockReturnValue("hex-string");

    useCase = new GetKeypairUseCase(
      () => mockLogger,
      mockStorageService,
      mockGenerateKeypairUseCase,
      mockGetEncryptionKeyUseCase,
      mockEncryptKeypairUseCase,
      mockDecryptKeypairUseCase,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("execute", () => {
    describe.each([
      {
        scenario: "when keypair exists in storage",
        setupStorage: (service: StorageService) => {
          vi.mocked(service.getKeyPair).mockResolvedValue(
            Right(mockEncryptedKeypair),
          );
        },
        expectedCalls: {
          getKeyPair: true,
          getEncryptionKey: true,
          decryptKeypair: true,
          generateKeypair: false,
          encryptKeypair: false,
          storeKeyPair: false,
          importKeyPair: true,
        },
        getDecryptArgs: () => [mockEncryptedKeypair, mockEncryptionKey],
        getImportArgs: () => [mockDecryptedKeypair, Curve.K256],
      },
      {
        scenario: "when keypair does not exist in storage",
        setupStorage: (service: StorageService) => {
          vi.mocked(service.getKeyPair).mockResolvedValue(
            Left(new StorageIDBGetError("Keypair not found")),
          );
        },
        expectedCalls: {
          getKeyPair: true,
          getEncryptionKey: true,
          decryptKeypair: false,
          generateKeypair: true,
          encryptKeypair: true,
          storeKeyPair: true,
          importKeyPair: false,
        },
        getEncryptArgs: () => [mockKeyPair, mockEncryptionKey],
        getStoreArgs: () => [mockEncryptedKeypair],
      },
    ])(
      "$scenario",
      ({
        setupStorage,
        expectedCalls,
        getDecryptArgs,
        getEncryptArgs,
        getStoreArgs,
        getImportArgs,
      }) => {
        beforeEach(() => {
          setupStorage(mockStorageService);
        });

        it("should return the keypair", async () => {
          const result = await useCase.execute();
          expect(result).toBe(mockKeyPair);
        });

        it("should call expected methods", async () => {
          await useCase.execute();

          if (expectedCalls.getKeyPair) {
            expect(mockStorageService.getKeyPair).toHaveBeenCalled();
          }
          if (expectedCalls.getEncryptionKey) {
            expect(mockGetEncryptionKeyUseCase.execute).toHaveBeenCalled();
          }

          if (expectedCalls.decryptKeypair) {
            expect(mockDecryptKeypairUseCase.execute).toHaveBeenCalledWith(
              ...getDecryptArgs!(),
            );
          } else {
            expect(mockDecryptKeypairUseCase.execute).not.toHaveBeenCalled();
          }

          if (expectedCalls.importKeyPair) {
            expect(mockCryptoService.importKeyPair).toHaveBeenCalledWith(
              ...getImportArgs!(),
            );
          } else {
            expect(mockCryptoService.importKeyPair).not.toHaveBeenCalled();
          }

          if (expectedCalls.generateKeypair) {
            expect(mockGenerateKeypairUseCase.execute).toHaveBeenCalled();
          } else {
            expect(mockGenerateKeypairUseCase.execute).not.toHaveBeenCalled();
          }

          if (expectedCalls.encryptKeypair) {
            expect(mockEncryptKeypairUseCase.execute).toHaveBeenCalledWith(
              ...getEncryptArgs!(),
            );
          } else {
            expect(mockEncryptKeypairUseCase.execute).not.toHaveBeenCalled();
          }

          if (expectedCalls.storeKeyPair) {
            expect(mockStorageService.storeKeyPair).toHaveBeenCalledWith(
              ...getStoreArgs!(),
            );
          } else {
            expect(mockStorageService.storeKeyPair).not.toHaveBeenCalled();
          }
        });
      },
    );
  });
});
