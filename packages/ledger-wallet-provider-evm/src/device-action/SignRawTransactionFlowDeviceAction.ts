import {
  type DeviceActionStateMachine,
  GlobalCommandError,
  hexaStringToBuffer,
  type InternalApi,
  OpenAppWithDependenciesDeviceAction,
  RefusedByUserDAError,
  type StateMachineTypes,
  UnknownDAError,
  UserInteractionRequired,
  XStateDeviceAction,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDeviceActionFactory,
  type Signature,
  SignTransactionDAStep,
  SignTransactionDeviceActionFactory,
} from "@ledgerhq/device-signer-kit-ethereum";
import { EthAppCommandError } from "@ledgerhq/device-signer-kit-ethereum/internal/app-binder/command/utils/ethAppErrors.js";
import type { SignFlowStatus } from "@ledgerhq/ledger-wallet-provider-core";
import type { UserInteractionNeeded } from "@ledgerhq/ledger-wallet-provider-core";
import {
  BlindSigningDisabledError,
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { Left, Right } from "purify-ts";
import { assign, setup } from "xstate";

import { createSignedTransaction } from "../transaction/TransactionHelper";
import {
  type SignRawTransactionFlowDAError,
  type SignRawTransactionFlowDAInput,
  type SignRawTransactionFlowDAIntermediateValue,
  type SignRawTransactionFlowDAInternalState,
  type SignRawTransactionFlowDAOutput,
  SignRawTransactionFlowDAStep,
} from "./SignRawTransactionFlowDeviceActionTypes";

type ChildDASnapshotContext = {
  readonly intermediateValue: {
    readonly requiredUserInteraction: UserInteractionRequired;
    readonly step?: string;
  };
};

export class SignRawTransactionFlowDeviceAction extends XStateDeviceAction<
  SignRawTransactionFlowDAOutput,
  SignRawTransactionFlowDAInput,
  SignRawTransactionFlowDAError,
  SignRawTransactionFlowDAIntermediateValue,
  SignRawTransactionFlowDAInternalState
> {
  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    SignRawTransactionFlowDAOutput,
    SignRawTransactionFlowDAInput,
    SignRawTransactionFlowDAError,
    SignRawTransactionFlowDAIntermediateValue,
    SignRawTransactionFlowDAInternalState
  > {
    type types = StateMachineTypes<
      SignRawTransactionFlowDAOutput,
      SignRawTransactionFlowDAInput,
      SignRawTransactionFlowDAError,
      SignRawTransactionFlowDAIntermediateValue,
      SignRawTransactionFlowDAInternalState
    >;

    const transactionBytes = hexaStringToBuffer(this.input.rawTransaction);
    if (!transactionBytes) {
      throw new Error("Invalid raw transaction hex string");
    }

    const openAppDA = new OpenAppWithDependenciesDeviceAction({
      input: this.input.openAppInput,
      inspect: false,
    });

    const getAddressDA = GetAddressDeviceActionFactory({
      derivationPath: this.input.derivationPath,
      checkOnDevice: false,
      returnChainCode: false,
      skipOpenApp: true,
      contextModule: this.input.contextModule,
      loggerFactory: this.getLoggerFactory(internalApi),
    });

    const signTransactionDA = SignTransactionDeviceActionFactory({
      derivationPath: this.input.derivationPath,
      transaction: transactionBytes,
      contextModule: this.input.contextModule,
      options: { skipOpenApp: true },
      loggerFactory: this.getLoggerFactory(internalApi),
    });

    return setup({
      types: {
        input: {} as types["input"],
        context: {} as types["context"],
        output: {} as types["output"],
      },
      actors: {
        openApp: openAppDA.makeStateMachine(internalApi),
        getAddress: getAddressDA.makeStateMachine(internalApi),
        signTransaction: signTransactionDA.makeStateMachine(internalApi),
      },
      guards: {
        hasNoError: ({ context }) => context._internalState.error === null,
      },
      actions: {
        assignErrorFromEvent: assign({
          _internalState: ({ context, event }) => ({
            ...context._internalState,
            error: (
              event as unknown as {
                error: SignRawTransactionFlowDAInternalState["error"];
              }
            ).error,
          }),
        }),
      },
    }).createMachine({
      id: "SignRawTransactionFlowDeviceAction",
      initial: "OpenApp",
      context: (_) => ({
        input: _.input,
        intermediateValue: {
          requiredUserInteraction: UserInteractionRequired.None,
          step: SignRawTransactionFlowDAStep.OPEN_APP,
          signFlowStatus: this.buildSignFlowStatus(
            UserInteractionRequired.None,
            SignRawTransactionFlowDAStep.OPEN_APP,
          ),
        },
        _internalState: {
          error: null,
          address: null,
          signedTransaction: null,
          lastSignStep: null,
        },
      }),
      states: {
        OpenApp: {
          invoke: {
            id: "openApp",
            input: ({ context }) => ({
              ...context.input.openAppInput,
            }),
            src: "openApp",
            onSnapshot: {
              actions: assign({
                intermediateValue: ({ event, context }) =>
                  this.updateIntermediateValue(
                    event.snapshot.context,
                    context.intermediateValue,
                    SignRawTransactionFlowDAStep.OPEN_APP,
                  ),
              }),
            },
            onDone: {
              actions: assign({
                _internalState: ({ event, context }) =>
                  this.normalizeOpenAppError(
                    this.addOpenAppResultToInternalState(
                      event.output,
                      context._internalState,
                    ),
                  ),
              }),
              target: "CheckOpenAppResult",
            },
            onError: {
              actions: assign({
                _internalState: ({ context, event }) =>
                  this.normalizeOpenAppError({
                    ...context._internalState,
                    error: (
                      event as unknown as {
                        error: SignRawTransactionFlowDAInternalState["error"];
                      }
                    ).error,
                  }),
              }),
              target: "CheckOpenAppResult",
            },
          },
        },

        CheckOpenAppResult: {
          always: [
            {
              target: "GetAddress",
              guard: "hasNoError",
            },
            "Error",
          ],
        },

        GetAddress: {
          entry: [
            assign({
              intermediateValue: {
                requiredUserInteraction: UserInteractionRequired.None,
                step: SignRawTransactionFlowDAStep.GET_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignRawTransactionFlowDAStep.GET_ADDRESS,
                ),
              },
            }),
          ],
          invoke: {
            id: "getAddress",
            src: "getAddress",
            input: getAddressDA.input,
            onSnapshot: {
              actions: assign({
                intermediateValue: ({ event, context }) =>
                  this.updateIntermediateValue(
                    event.snapshot.context,
                    context.intermediateValue,
                    SignRawTransactionFlowDAStep.GET_ADDRESS,
                  ),
              }),
            },
            onDone: {
              actions: assign({
                _internalState: ({ event, context }) =>
                  this.addGetAddressResultToInternalState(
                    event.output,
                    context._internalState,
                  ),
              }),
              target: "CheckGetAddressResult",
            },
            onError: {
              actions: "assignErrorFromEvent",
              target: "CheckGetAddressResult",
            },
          },
        },

        CheckGetAddressResult: {
          always: [
            {
              target: "VerifyAddress",
              guard: "hasNoError",
            },
            "Error",
          ],
        },

        VerifyAddress: {
          entry: [
            assign({
              intermediateValue: {
                requiredUserInteraction: UserInteractionRequired.None,
                step: SignRawTransactionFlowDAStep.VERIFY_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignRawTransactionFlowDAStep.VERIFY_ADDRESS,
                ),
              },
              _internalState: ({ context }) => this.verifyAddressMatch(context),
            }),
          ],
          after: {
            0: [
              {
                target: "Sign",
                guard: "hasNoError",
              },
              { target: "Error" },
            ],
          },
        },

        Sign: {
          entry: [
            assign({
              intermediateValue: {
                requiredUserInteraction: UserInteractionRequired.SignTransaction,
                step: SignRawTransactionFlowDAStep.SIGN,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.SignTransaction,
                  SignRawTransactionFlowDAStep.SIGN,
                ),
              },
            }),
          ],
          invoke: {
            id: "signTransaction",
            src: "signTransaction",
            input: signTransactionDA.input,
            onSnapshot: {
              actions: assign({
                intermediateValue: ({ event, context }) =>
                  this.updateIntermediateValue(
                    event.snapshot.context,
                    context.intermediateValue,
                    SignRawTransactionFlowDAStep.SIGN,
                  ),
                _internalState: ({ event, context }) => ({
                  ...context._internalState,
                  lastSignStep:
                    event.snapshot.context.intermediateValue?.step ??
                    context._internalState.lastSignStep,
                }),
              }),
            },
            onDone: {
              actions: assign({
                _internalState: ({ event, context }) =>
                  this.addSignResultToInternalState(
                    event.output,
                    context._internalState,
                  ),
              }),
              target: "CheckSignResult",
            },
            onError: {
              actions: "assignErrorFromEvent",
              target: "CheckSignResult",
            },
          },
        },

        CheckSignResult: {
          entry: [
            assign({
              _internalState: ({ context }) =>
                this.normalizeSignError(context._internalState),
            }),
          ],
          // `after: { 0 }` instead of `always` so entry actions execute before the guard
          after: {
            0: [
              {
                target: "Success",
                guard: "hasNoError",
              },
              { target: "Error" },
            ],
          },
        },

        Success: {
          type: "final",
        },

        Error: {
          type: "final",
        },
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore purify-ts dual-package (ESM/CJS) causes Either to resolve to two incompatible module paths in the IDE TS server; tsc compiles cleanly
      output: ({ context }) => this.buildOutput(context._internalState),
    });
  }

  private updateIntermediateValue(
    childContext: ChildDASnapshotContext,
    currentIntermediate: SignRawTransactionFlowDAIntermediateValue,
    step: SignRawTransactionFlowDAStep,
  ): SignRawTransactionFlowDAIntermediateValue {
    const interaction =
      childContext.intermediateValue.requiredUserInteraction ??
      currentIntermediate.requiredUserInteraction;
    return {
      requiredUserInteraction: interaction,
      step,
      signFlowStatus: this.buildSignFlowStatus(interaction, step),
    };
  }

  private addOpenAppResultToInternalState(
    output: {
      caseOf: (handlers: {
        Right: () => SignRawTransactionFlowDAInternalState;
        Left: (
          e: SignRawTransactionFlowDAError,
        ) => SignRawTransactionFlowDAInternalState;
      }) => SignRawTransactionFlowDAInternalState;
    },
    internalState: SignRawTransactionFlowDAInternalState,
  ): SignRawTransactionFlowDAInternalState {
    return output.caseOf({
      Right: () => internalState,
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private normalizeOpenAppError(
    internalState: SignRawTransactionFlowDAInternalState,
  ): SignRawTransactionFlowDAInternalState {
    const { error } = internalState;
    if (
      error instanceof RefusedByUserDAError ||
      (error instanceof GlobalCommandError && error.errorCode === "5501")
    ) {
      return {
        ...internalState,
        error: new UserRejectedTransactionError("User rejected open app"),
      } as SignRawTransactionFlowDAInternalState;
    }
    return internalState;
  }

  private addGetAddressResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (result: { address: string }) => T;
        Left: (e: SignRawTransactionFlowDAError) => T;
      }) => T;
    },
    internalState: SignRawTransactionFlowDAInternalState,
  ): SignRawTransactionFlowDAInternalState {
    return output.caseOf<SignRawTransactionFlowDAInternalState>({
      Right: (result) => ({ ...internalState, address: result.address }),
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private addSignResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (result: Signature) => T;
        Left: (e: SignRawTransactionFlowDAError) => T;
      }) => T;
    },
    internalState: SignRawTransactionFlowDAInternalState,
  ): SignRawTransactionFlowDAInternalState {
    return output.caseOf<SignRawTransactionFlowDAInternalState>({
      Right: (result) => {
        try {
          return {
            ...internalState,
            signedTransaction: createSignedTransaction(
              this.input.rawTransaction,
              result,
            ),
          };
        } catch (e) {
          return {
            ...internalState,
            error: new UnknownDAError(
              `Failed to serialize signed transaction: ${e instanceof Error ? e.message : String(e)}`,
            ),
          };
        }
      },
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private verifyAddressMatch({
    _internalState,
    input,
  }: {
    _internalState: SignRawTransactionFlowDAInternalState;
    input: SignRawTransactionFlowDAInput;
  }): SignRawTransactionFlowDAInternalState {
    const expected = input.expectedAddress;
    const actual = _internalState.address;
    if (actual?.toLowerCase() !== expected.toLowerCase()) {
      return {
        ..._internalState,
        error: new IncorrectSeedError("Address mismatch"),
      };
    }
    return _internalState;
  }

  private normalizeSignError(
    internalState: SignRawTransactionFlowDAInternalState,
  ): SignRawTransactionFlowDAInternalState {
    const { error, lastSignStep } = internalState;
    if (error instanceof EthAppCommandError) {
      if (
        error.errorCode === "6a80" &&
        lastSignStep === SignTransactionDAStep.BLIND_SIGN_TRANSACTION_FALLBACK
      ) {
        return {
          ...internalState,
          error: new BlindSigningDisabledError("Blind signing disabled"),
        } as SignRawTransactionFlowDAInternalState;
      }
      if (error.errorCode === "6985") {
        return {
          ...internalState,
          error: new UserRejectedTransactionError(
            "User rejected transaction signing",
          ),
        } as SignRawTransactionFlowDAInternalState;
      }
    }
    return internalState;
  }

  private buildOutput(internalState: SignRawTransactionFlowDAInternalState) {
    const { signedTransaction, error } = internalState;
    if (signedTransaction) {
      return Right(signedTransaction);
    }
    return Left(error || new UnknownDAError("No error in final state"));
  }

  private buildSignFlowStatus(
    interaction: UserInteractionRequired,
    step: SignRawTransactionFlowDAStep,
  ): SignFlowStatus {
    const signType = this.input.signType;
    if (interaction && interaction !== UserInteractionRequired.None) {
      return {
        signType,
        status: "user-interaction-needed",
        interaction: interaction as UserInteractionNeeded,
      };
    }
    return {
      signType,
      status: "debugging",
      message: `Step: ${step}`,
    };
  }
}
