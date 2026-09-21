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
  SignTransactionDeviceActionFactory,
} from "@ledgerhq/device-signer-kit-ethereum";
import { ethers } from "ethers";
import { Left, Right } from "purify-ts";
import { type Mock, vi } from "vitest";
import { assign, createMachine } from "xstate";

import type { SignRawTransactionFlowDAInput } from "../SignRawTransactionFlowDeviceActionTypes";

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

export const DEFAULT_ADDRESS = "0xabc123";

export const DEFAULT_RAW_TRANSACTION = ethers.Transaction.from({
  chainId: 1,
  to: "0x1234567890abcdef1234567890abcdef12345678",
  value: 0n,
  data: "0x",
}).unsignedSerialized;

export const DEFAULT_INPUT: SignRawTransactionFlowDAInput = {
  signType: "transaction",
  derivationPath: "44'/60'/0'/0/0",
  rawTransaction: DEFAULT_RAW_TRANSACTION,
  expectedAddress: DEFAULT_ADDRESS,
  openAppInput: { application: { name: "Ethereum" }, dependencies: [] },
  contextModule: {} as ContextModule,
};

export function setupOpenAppMock(error?: unknown): void {
  (OpenAppWithDependenciesDeviceAction as Mock).mockImplementation(function () {
    return {
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
    };
  });
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

export function setupSignTransactionMock(
  signature?: Signature,
  error?: unknown,
  childStep?: string,
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
                step: childStep,
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
