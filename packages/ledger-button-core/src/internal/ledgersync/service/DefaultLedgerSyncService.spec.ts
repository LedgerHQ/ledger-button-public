import {
  DeviceActionState,
  DeviceActionStatus,
} from "@ledgerhq/device-management-kit";
import {
  AuthenticateDAError,
  AuthenticateDAIntermediateValue,
  AuthenticateDAOutput,
  KeyPair,
  LedgerKeyringProtocol,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import pako from "pako";
import { lastValueFrom, of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerSyncAuthenticationError } from "../../../api/model/errors.js";
import type { Config } from "../../config/model/config.js";
import type { GetKeypairUseCase } from "../../cryptographic/usecases/GetKeypairUseCase.js";
import type { DeviceManagementKitService } from "../../device/service/DeviceManagementKitService.js";
import type { StorageService } from "../../storage/StorageService.js";
import { LedgerSyncAuthContextMissingError } from "../model/errors.js";
import { DefaultLedgerSyncService } from "./DefaultLedgerSyncService.js";

describe("DefaultLedgerSyncService", () => {
  let service: DefaultLedgerSyncService;
  let mockDeviceManagementKitService: {
    dmk: unknown;
    sessionId: string | undefined;
  };
  let mockStorageService: {
    getTrustChainId: ReturnType<typeof vi.fn>;
    saveTrustChainId: ReturnType<typeof vi.fn>;
  };
  let mockGetKeypairUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  let mockConfig: Config;
  let mockLkrpAppKit: {
    authenticate: ReturnType<typeof vi.fn>;
    decryptData: ReturnType<typeof vi.fn>;
  };
  let mockKeypair: KeyPair;

  const mockJWT = {
    access_token: "test-access-token",
    permissions: {},
  };

  const mockAuthOutput: AuthenticateDAOutput = {
    jwt: mockJWT,
    trustchainId: "test-trustchain-id",
    encryptionKey: new Uint8Array([1, 2, 3, 4, 5]),
    applicationPath: "test-app-path",
  };

  beforeEach(() => {
    mockKeypair = {
      getPublicKeyToHex: vi.fn().mockReturnValue("mock-public-key-hex"),
    } as unknown as KeyPair;

    mockDeviceManagementKitService = {
      dmk: {},
      sessionId: "test-session-id",
    };

    mockStorageService = {
      getTrustChainId: vi.fn().mockReturnValue({
        extract: vi.fn().mockReturnValue(undefined),
      }),
      saveTrustChainId: vi.fn(),
    };

    mockGetKeypairUseCase = {
      execute: vi.fn().mockResolvedValue(mockKeypair),
    };

    mockConfig = {
      environment: "staging",
      dAppIdentifier: "test-dapp",
      lkrp: {},
    } as Config;

    mockLkrpAppKit = {
      authenticate: vi.fn(),
      decryptData: vi.fn(),
    };

    service = new DefaultLedgerSyncService(
      vi.fn().mockReturnValue({
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
      mockStorageService as unknown as StorageService,
      mockGetKeypairUseCase as unknown as GetKeypairUseCase,
      mockConfig,
    );

    service.lkrpAppKit = mockLkrpAppKit as unknown as LedgerKeyringProtocol;

    vi.clearAllMocks();
  });

  describe("authContext", () => {
    it("should return undefined when no authentication has occurred", () => {
      expect(service.authContext).toBeUndefined();
    });
  });

  describe("authenticate", () => {
    it.each([
      {
        description: "no trustchain ID exists",
        trustchainId: undefined,
        shouldCheckKeypairExecution: true,
        shouldCheckSaveTrustChain: true,
        shouldCheckAuthContext: true,
        status: DeviceActionStatus.Completed,
        output: mockAuthOutput,
        expectedResult: {
          trustChainId: "test-trustchain-id",
          applicationPath: "test-app-path",
        },
      },
      {
        description: "trustchain ID exists",
        trustchainId: "existing-trustchain-id",
        shouldCheckKeypairExecution: false,
        shouldCheckSaveTrustChain: false,
        shouldCheckAuthContext: false,
        status: DeviceActionStatus.Completed,
        output: mockAuthOutput,
        expectedResult: {
          trustChainId: "test-trustchain-id",
          applicationPath: "test-app-path",
        },
      },
      {
        description: "device action is pending",
        trustchainId: undefined,
        shouldCheckKeypairExecution: false,
        shouldCheckSaveTrustChain: false,
        shouldCheckAuthContext: false,
        status: DeviceActionStatus.Pending,
        intermediateValue: {
          requiredUserInteraction: "unlock-device",
        } as AuthenticateDAIntermediateValue,
        expectedResult: {
          requiredUserInteraction: "unlock-device",
        },
      },
      {
        description: "production environment is used",
        trustchainId: undefined,
        shouldCheckKeypairExecution: true,
        shouldCheckSaveTrustChain: true,
        shouldCheckAuthContext: true,
        environment: "production" as const,
        status: DeviceActionStatus.Completed,
        output: mockAuthOutput,
        expectedResult: {
          trustChainId: "test-trustchain-id",
          applicationPath: "test-app-path",
        },
      },
      {
        description: "staging environment is used",
        trustchainId: undefined,
        shouldCheckKeypairExecution: true,
        shouldCheckSaveTrustChain: true,
        shouldCheckAuthContext: true,
        environment: "staging" as const,
        status: DeviceActionStatus.Completed,
        output: mockAuthOutput,
        expectedResult: {
          trustChainId: "test-trustchain-id",
          applicationPath: "test-app-path",
        },
      },
    ])(
      "should handle authentication when $description",
      async ({
        trustchainId,
        shouldCheckKeypairExecution,
        shouldCheckSaveTrustChain,
        shouldCheckAuthContext,
        environment,
        status,
        output,
        intermediateValue,
        expectedResult,
      }) => {
        if (environment) {
          mockConfig.environment = environment;
        }

        mockStorageService.getTrustChainId.mockReturnValue({
          extract: vi.fn().mockReturnValue(trustchainId),
        });

        let state: DeviceActionState<
          AuthenticateDAOutput,
          AuthenticateDAError,
          AuthenticateDAIntermediateValue
        >;

        if (status === DeviceActionStatus.Completed && output) {
          state = { status, output };
        } else if (status === DeviceActionStatus.Pending && intermediateValue) {
          state = { status, intermediateValue };
        } else {
          throw new Error("Invalid test configuration");
        }

        mockLkrpAppKit.authenticate.mockReturnValue({
          observable: of(state),
        });

        const result$ = service.authenticate();
        const result = await lastValueFrom(result$);

        const authenticateCall = mockLkrpAppKit.authenticate.mock.calls[0][0];
        const mockSessionId = !trustchainId
          ? mockDeviceManagementKitService.sessionId
          : undefined;

        if (shouldCheckKeypairExecution) {
          expect(mockGetKeypairUseCase.execute).toHaveBeenCalled();
        }

        expect(mockLkrpAppKit.authenticate).toHaveBeenCalled();

        expect(authenticateCall).toEqual(
          expect.objectContaining({
            keypair: mockKeypair,
            clientName: `LedgerWalletProvider::${mockConfig.dAppIdentifier}`,
            trustchainId: trustchainId,
            sessionId: mockSessionId,
          }),
        );

        expect(result).toEqual(expectedResult);

        if (shouldCheckSaveTrustChain) {
          expect(mockStorageService.saveTrustChainId).toHaveBeenCalledWith(
            "test-trustchain-id",
          );
        }

        if (shouldCheckAuthContext) {
          expect(service.authContext).toBeDefined();
          expect(service.authContext?.trustChainId).toBe("test-trustchain-id");
        }
      },
    );

    it.each([
      {
        description: "device disconnected",
        status: DeviceActionStatus.Error,
        error: { type: "DeviceDisconnected" } as unknown as AuthenticateDAError,
        expectedMessage: "An unknown error occurred",
      },
      {
        description: "user rejected",
        status: DeviceActionStatus.Error,
        error: { type: "UserRejected" } as unknown as AuthenticateDAError,
        expectedMessage: "An unknown error occurred",
      },
      {
        description: "timeout",
        status: DeviceActionStatus.Error,
        error: { type: "Timeout" } as unknown as AuthenticateDAError,
        expectedMessage: "An unknown error occurred",
      },
      {
        description: "unknown device action status",
        status: "UnknownStatus" as any,
        expectedMessage: "Unknown error",
      },
    ])(
      "should return LedgerSyncAuthenticationError when $description",
      async ({ status, error, expectedMessage }) => {
        const errorState: DeviceActionState<
          AuthenticateDAOutput,
          AuthenticateDAError,
          AuthenticateDAIntermediateValue
        > = {
          status,
          ...(error && { error }),
        } as any;

        mockLkrpAppKit.authenticate.mockReturnValue({
          observable: of(errorState),
        });

        const result$ = service.authenticate();
        const result = await lastValueFrom(result$);

        expect(result).toBeInstanceOf(LedgerSyncAuthenticationError);
        expect((result as LedgerSyncAuthenticationError).message).toBe(
          expectedMessage,
        );
      },
    );

    it("should throw error when no session ID exists and no trustchain ID", async () => {
      mockDeviceManagementKitService.sessionId = undefined;
      mockStorageService.getTrustChainId.mockReturnValue({
        extract: vi.fn().mockReturnValue(undefined),
      });

      const result$ = service.authenticate();

      await expect(lastValueFrom(result$)).rejects.toThrow("No session ID");
    });
  });

  describe("decrypt", () => {
    it("should successfully decrypt data when auth context exists", async () => {
      service["_authContext"] = {
        jwt: mockJWT,
        encryptionKey: new Uint8Array([1, 2, 3, 4, 5]),
        trustChainId: "test-trustchain-id",
        applicationPath: "test-app-path",
        keypair: new Uint8Array([6, 7, 8]),
      };

      const testData = "test-data";
      const compressedData = pako.deflate(new TextEncoder().encode(testData));
      const encryptedData = new Uint8Array([10, 20, 30, 40, 50]);

      mockLkrpAppKit.decryptData.mockResolvedValue(compressedData);

      const result = await service.decrypt(encryptedData);

      expect(mockLkrpAppKit.decryptData).toHaveBeenCalledWith(
        service.authContext?.encryptionKey,
        encryptedData,
      );

      const decompressed = pako.inflate(compressedData);
      expect(result).toEqual(decompressed);
    });

    it.each([
      {
        description: "no auth context exists",
        authContext: undefined,
        shouldCheckMessage: true,
      },
      {
        description: "auth context has no encryption key",
        authContext: {
          jwt: mockJWT,
          encryptionKey: undefined as unknown as Uint8Array,
          trustChainId: "test-trustchain-id",
          applicationPath: "test-app-path",
          keypair: new Uint8Array([6, 7, 8]),
        },
        shouldCheckMessage: false,
      },
    ])(
      "should throw LedgerSyncAuthContextMissingError when $description",
      async ({ authContext, shouldCheckMessage }) => {
        service["_authContext"] = authContext;

        const encryptedData = new Uint8Array([10, 20, 30]);

        await expect(service.decrypt(encryptedData)).rejects.toThrow(
          LedgerSyncAuthContextMissingError,
        );

        if (shouldCheckMessage) {
          await expect(service.decrypt(encryptedData)).rejects.toThrow(
            "No encryption key",
          );
        }
      },
    );
  });
});
