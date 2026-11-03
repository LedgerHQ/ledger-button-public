/* eslint @typescript-eslint/consistent-type-imports: 0 */
import {
  type DeviceActionState,
  type InternalApi,
  OpenAppWithDependenciesDeviceAction,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { Left, Right } from "purify-ts";
import { type Observable, type Subscription } from "rxjs";
import { type Mock, vi } from "vitest";
import { assign, createMachine } from "xstate";

import type {
  SignXrpTransactionFlowDAError,
  SignXrpTransactionFlowDAInput,
  SignXrpTransactionFlowDAIntermediateValue,
  SignXrpTransactionFlowDAOutput,
} from "../SignXrpTransactionFlowDeviceActionTypes";

export type SignXrpTransactionFlowDAState = DeviceActionState<
  SignXrpTransactionFlowDAOutput,
  SignXrpTransactionFlowDAError,
  SignXrpTransactionFlowDAIntermediateValue
>;

export const DEFAULT_ADDRESS = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
export const PUBLIC_KEY =
  "03430ce12840c76b40f778c7900dc706cedaf6073947a1437179ef8bd402f871af";
export const DER_SIGNATURE = new Uint8Array([0x30, 0x45, 0x02, 0x21]);

export const DEFAULT_INPUT: SignXrpTransactionFlowDAInput = {
  derivationPath: "44'/144'/0'/0/0",
  transaction: {
    TransactionType: "Payment",
    Destination: "rQruxtzFbPR2JgBp47FEbh4pAyYDStcLJH",
    Amount: "1000000",
    Fee: "10",
    Sequence: 1,
  },
  expectedAddress: DEFAULT_ADDRESS,
  openAppInput: { application: { name: "XRP" }, dependencies: [] },
};

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

export function makeChildMachine(
  interaction: UserInteractionRequired,
  output: () => unknown,
) {
  return createMachine({
    initial: "pending",
    states: {
      pending: {
        entry: assign({
          intermediateValue: { requiredUserInteraction: interaction },
        }),
        after: { 0: "done" },
      },
      done: { type: "final" as const },
    },
    output,
  });
}

export function setupOpenAppMock(error?: unknown): void {
  (OpenAppWithDependenciesDeviceAction as Mock).mockImplementation(function () {
    return {
      makeStateMachine: vi.fn(() =>
        makeChildMachine(UserInteractionRequired.ConfirmOpenApp, () =>
          error ? Left(error) : Right(undefined),
        ),
      ),
    };
  });
}

export const executeUntilStep = <T>(
  targetStep: number,
  o: Observable<T>,
): Promise<{ steps: T[] }> =>
  new Promise((resolve, reject) => {
    const steps: T[] = [];
    let subscription: Subscription | undefined = undefined;

    subscription = o.subscribe({
      next: (state) => {
        steps.push(state);
        if (steps.length > targetStep) {
          subscription?.unsubscribe();
          resolve({ steps });
        }
      },
      error: reject,
      complete: () => resolve({ steps }),
    });
  });
