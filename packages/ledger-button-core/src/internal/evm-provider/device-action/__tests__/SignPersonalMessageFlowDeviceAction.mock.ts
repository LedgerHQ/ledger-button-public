/* eslint @typescript-eslint/consistent-type-imports: 0 */
import type { ContextModule } from "@ledgerhq/context-module";
import {
  type InternalApi,
  OpenAppWithDependenciesDeviceAction,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDeviceActionFactory,
  type Signature,
  SignPersonalMessageDeviceActionFactory,
} from "@ledgerhq/device-signer-kit-ethereum";
import { Left, Right } from "purify-ts";
import { type Mock, vi } from "vitest";
import { assign, createMachine } from "xstate";

import type { SignPersonalMessageFlowDAInput } from "../SignPersonalMessageFlowDeviceActionTypes.js";

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

export const VALID_SIGNATURE: Signature = {
  r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  s: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  v: 28,
};

export const VALID_SIGNATURE_HEX =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1c";

export const DEFAULT_ADDRESS = "0xabc123";

export const DEFAULT_INPUT: SignPersonalMessageFlowDAInput = {
  signType: "personal-sign",
  derivationPath: "44'/60'/0'/0/0",
  message: "Hello, world!",
  expectedAddress: DEFAULT_ADDRESS,
  openAppInput: { application: { name: "Ethereum" }, dependencies: [] },
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
        output: () =>
          error ? Left(error) : Right({ address: address ?? DEFAULT_ADDRESS }),
      }),
    ),
    input: {},
  });
}

export function setupSignMessageMock(
  signature?: Signature,
  error?: unknown,
): void {
  (SignPersonalMessageDeviceActionFactory as Mock).mockReturnValue({
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
          error ? Left(error) : Right(signature ?? VALID_SIGNATURE),
      }),
    ),
    input: {},
  });
}
