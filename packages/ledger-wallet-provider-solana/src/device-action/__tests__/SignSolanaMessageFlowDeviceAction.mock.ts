/* eslint @typescript-eslint/consistent-type-imports: 0 */
import {
  type InternalApi,
  OpenAppWithDependenciesDeviceAction,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDeviceActionFactory,
  SignMessageDeviceActionFactory,
} from "@ledgerhq/device-signer-kit-solana";
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

const SIGNATURE_BYTES = new Uint8Array(64).fill(7);

/** The 64-byte ed25519 signature (base58) the flow should extract. */
export const VALID_SIGNATURE_BASE58 = base58(SIGNATURE_BYTES);

/**
 * The OCM (preamble + content) that was actually signed. These are the bytes
 * the flow should expose as `signedMessage`.
 */
export const SIGNED_MESSAGE_BYTES = new Uint8Array([
  0xff, 0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, 0x6f, 0x66, 0x66, 0x63, 0x68,
  0x61, 0x69, 0x6e, 0x01, 0x01, 0x48, 0x69,
]);

/**
 * A full OCM envelope `[versionByte(0x01)][signature(64)][ocm...]` as returned
 * by the signer kit for the V0/V1/Legacy signing modes.
 */
export const VALID_ENVELOPE_BASE58 = base58(
  new Uint8Array([0x01, ...SIGNATURE_BYTES, ...SIGNED_MESSAGE_BYTES]),
);

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
  (GetAddressDeviceActionFactory as unknown as Mock).mockReturnValue({
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

export function setupSignMessageMock(
  signature?: string,
  error?: unknown,
): void {
  (SignMessageDeviceActionFactory as unknown as Mock).mockReturnValue({
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
            : Right({ signature: signature ?? VALID_ENVELOPE_BASE58 }),
      }),
    ),
    input: {},
  });
}
