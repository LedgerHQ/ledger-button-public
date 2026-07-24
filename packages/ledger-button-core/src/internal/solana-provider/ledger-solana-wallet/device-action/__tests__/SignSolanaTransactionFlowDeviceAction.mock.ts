/* eslint @typescript-eslint/consistent-type-imports: 0 */
import type { ContextModule } from "@ledgerhq/context-module";
import {
  type InternalApi,
  OpenAppWithDependenciesDeviceAction,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDeviceActionFactory,
  SignTransactionDeviceActionFactory,
} from "@ledgerhq/device-signer-kit-solana";
import { Left, Right } from "purify-ts";
import { type Mock, vi } from "vitest";
import { assign, createMachine } from "xstate";

import type { SignSolanaTransactionFlowDAInput } from "../SignSolanaTransactionFlowDeviceActionTypes.js";

export function makeInternalApiMock(): InternalApi {
  const loggerStub = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    subscribers: [],
  };
  return {
    sendApdu: vi.fn(),
    sendCommand: vi.fn(),
    getDeviceModel: vi.fn(),
    getDeviceSessionState: vi.fn(),
    getDeviceSessionStateObservable: vi.fn(),
    setDeviceSessionState: vi.fn(),
    getManagerApiService: vi.fn(),
    getSecureChannelService: vi.fn(),
    loggerFactory: vi.fn(() => loggerStub),
  } as unknown as InternalApi;
}

// System program id: a valid 32-byte base58 address.
export const DEFAULT_ADDRESS = "11111111111111111111111111111111";

export const VALID_SIGNATURE: Uint8Array = new Uint8Array(64).fill(7);

export const DEFAULT_TRANSACTION: Uint8Array = new Uint8Array([1, 2, 3, 4]);

export const DEFAULT_INPUT: SignSolanaTransactionFlowDAInput = {
  signType: "transaction",
  derivationPath: "44'/501'/0'",
  transaction: DEFAULT_TRANSACTION,
  expectedAddress: DEFAULT_ADDRESS,
  openAppInput: { application: { name: "Solana" }, dependencies: [] },
  contextModule: {} as ContextModule,
};

export function setupOpenAppMock(error?: unknown): void {
  (OpenAppWithDependenciesDeviceAction as Mock).mockImplementation(() => ({
    makeStateMachine: vi.fn().mockImplementation(() =>
      createMachine({
        initial: "pending",
        states: {
          pending: {
            entry: assign({
              intermediateValue: {
                requiredUserInteraction: UserInteractionRequired.ConfirmOpenApp,
              },
            }),
            after: { 0: "done" },
          },
          done: { type: "final" as const },
        },
        output: () => (error ? Left(error) : Right(undefined)),
      }),
    ),
  }));
}

export function setupGetAddressMock(address?: string, error?: unknown): void {
  (GetAddressDeviceActionFactory as Mock).mockReturnValue({
    makeStateMachine: vi.fn().mockImplementation(() =>
      createMachine({
        initial: "pending",
        states: {
          pending: {
            entry: assign({
              intermediateValue: {
                requiredUserInteraction: UserInteractionRequired.None,
              },
            }),
            after: { 0: "done" },
          },
          done: { type: "final" as const },
        },
        output: () => (error ? Left(error) : Right(address ?? DEFAULT_ADDRESS)),
      }),
    ),
    input: {},
  });
}

export function setupSignTransactionMock(
  signature?: Uint8Array,
  error?: unknown,
): void {
  (SignTransactionDeviceActionFactory as Mock).mockReturnValue({
    makeStateMachine: vi.fn().mockImplementation(() =>
      createMachine({
        initial: "pending",
        states: {
          pending: {
            entry: assign({
              intermediateValue: {
                requiredUserInteraction:
                  UserInteractionRequired.SignTransaction,
              },
            }),
            after: { 0: "done" },
          },
          done: { type: "final" as const },
        },
        output: () =>
          error ? Left(error) : Right(signature ?? VALID_SIGNATURE),
      }),
    ),
    input: {},
  });
}
