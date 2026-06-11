/* eslint @typescript-eslint/consistent-type-imports: 0 */
import {
  CallTaskInAppDeviceAction,
  type InternalApi,
  OpenAppWithDependenciesDeviceAction,
  SendCommandInAppDeviceAction,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { getBase58Decoder } from "@solana/kit";
import { Left, Right } from "purify-ts";
import { type Mock, vi } from "vitest";
import { assign, createMachine } from "xstate";

import type { SignSolanaMessageFlowDAInput } from "../SignSolanaMessageFlowDeviceActionTypes.js";

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

const base58 = (bytes: Uint8Array): string => getBase58Decoder().decode(bytes);

/** A bare 64-byte ed25519 signature, base58 encoded (Raw mode shape). */
export const VALID_SIGNATURE_BASE58 = base58(new Uint8Array(64).fill(7));

/** A payload that is neither a 64-byte signature nor a valid OCM envelope. */
export const INVALID_SIGNATURE_BASE58 = base58(new Uint8Array(10));

export const DEFAULT_ADDRESS = "So1anaAddr1111111111111111111111111111111111";

export const DEFAULT_INPUT: SignSolanaMessageFlowDAInput = {
  signType: "solana-message",
  derivationPath: "44'/501'/0'/0'",
  message: new TextEncoder().encode("Hello, Solana!"),
  expectedAddress: DEFAULT_ADDRESS,
  openAppInput: { application: { name: "Solana" }, dependencies: [] },
};

export function setupOpenAppMock(error?: unknown): void {
  (OpenAppWithDependenciesDeviceAction as unknown as Mock).mockImplementation(
    () => ({
      makeStateMachine: vi.fn().mockImplementation(() =>
        createMachine({
          initial: "pending",
          states: {
            pending: {
              entry: assign({
                intermediateValue: {
                  requiredUserInteraction:
                    UserInteractionRequired.ConfirmOpenApp,
                },
              }),
              after: { 0: "done" },
            },
            done: { type: "final" as const },
          },
          output: () => (error ? Left(error) : Right(undefined)),
        }),
      ),
      input: {},
    }),
  );
}

export function setupGetAddressMock(address?: string, error?: unknown): void {
  (SendCommandInAppDeviceAction as unknown as Mock).mockImplementation(() => ({
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
        output: () =>
          error ? Left(error) : Right(address ?? DEFAULT_ADDRESS),
      }),
    ),
    input: {},
  }));
}

export function setupSignMessageMock(
  signature?: string,
  error?: unknown,
): void {
  (CallTaskInAppDeviceAction as unknown as Mock).mockImplementation(() => ({
    makeStateMachine: vi.fn().mockImplementation(() =>
      createMachine({
        initial: "pending",
        states: {
          pending: {
            entry: assign({
              intermediateValue: {
                requiredUserInteraction:
                  UserInteractionRequired.SignPersonalMessage,
              },
            }),
            after: { 0: "done" },
          },
          done: { type: "final" as const },
        },
        output: () =>
          error
            ? Left(error)
            : Right({ signature: signature ?? VALID_SIGNATURE_BASE58 }),
      }),
    ),
    input: {},
  }));
}
