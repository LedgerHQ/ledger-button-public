import {
  type DeviceActionStateMachine,
  GlobalCommandError,
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
  SignTypedDataDAStateStep,
  SignTypedDataDeviceActionFactory,
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

import { getHexaStringFromSignature } from "../transaction/TransactionHelper";
import {
  type SignTypedDataFlowDAError,
  type SignTypedDataFlowDAInput,
  type SignTypedDataFlowDAIntermediateValue,
  type SignTypedDataFlowDAInternalState,
  type SignTypedDataFlowDAOutput,
  SignTypedDataFlowDAStep,
} from "./SignTypedDataFlowDeviceActionTypes";

type ChildDASnapshotContext = {
  readonly intermediateValue: {
    readonly requiredUserInteraction: UserInteractionRequired;
    readonly step?: string;
  };
};

export class SignTypedDataFlowDeviceAction extends XStateDeviceAction<
  SignTypedDataFlowDAOutput,
  SignTypedDataFlowDAInput,
  SignTypedDataFlowDAError,
  SignTypedDataFlowDAIntermediateValue,
  SignTypedDataFlowDAInternalState
> {
  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    SignTypedDataFlowDAOutput,
    SignTypedDataFlowDAInput,
    SignTypedDataFlowDAError,
    SignTypedDataFlowDAIntermediateValue,
    SignTypedDataFlowDAInternalState
  > {
    type types = StateMachineTypes<
      SignTypedDataFlowDAOutput,
      SignTypedDataFlowDAInput,
      SignTypedDataFlowDAError,
      SignTypedDataFlowDAIntermediateValue,
      SignTypedDataFlowDAInternalState
    >;

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

    const signTypedDataDA = SignTypedDataDeviceActionFactory({
      derivationPath: this.input.derivationPath,
      data: this.input.typedData,
      contextModule: this.input.contextModule,
      skipOpenApp: true,
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
        signTypedData: signTypedDataDA.makeStateMachine(internalApi),
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
                error: SignTypedDataFlowDAInternalState["error"];
              }
            ).error,
          }),
        }),
      },
    }).createMachine({
      id: "SignTypedDataFlowDeviceAction",
      initial: "OpenApp",
      context: (_) => ({
        input: _.input,
        intermediateValue: {
          requiredUserInteraction: UserInteractionRequired.None,
          step: SignTypedDataFlowDAStep.OPEN_APP,
          signFlowStatus: this.buildSignFlowStatus(
            UserInteractionRequired.None,
            SignTypedDataFlowDAStep.OPEN_APP,
          ),
        },
        _internalState: {
          error: null,
          address: null,
          signature: null,
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
                    SignTypedDataFlowDAStep.OPEN_APP,
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
                        error: SignTypedDataFlowDAInternalState["error"];
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
                step: SignTypedDataFlowDAStep.GET_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignTypedDataFlowDAStep.GET_ADDRESS,
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
                    SignTypedDataFlowDAStep.GET_ADDRESS,
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
                step: SignTypedDataFlowDAStep.VERIFY_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignTypedDataFlowDAStep.VERIFY_ADDRESS,
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
                requiredUserInteraction: UserInteractionRequired.SignTypedData,
                step: SignTypedDataFlowDAStep.SIGN,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.SignTypedData,
                  SignTypedDataFlowDAStep.SIGN,
                ),
              },
            }),
          ],
          invoke: {
            id: "signTypedData",
            src: "signTypedData",
            input: signTypedDataDA.input,
            onSnapshot: {
              actions: assign({
                intermediateValue: ({ event, context }) =>
                  this.updateIntermediateValue(
                    event.snapshot.context,
                    context.intermediateValue,
                    SignTypedDataFlowDAStep.SIGN,
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
    currentIntermediate: SignTypedDataFlowDAIntermediateValue,
    step: SignTypedDataFlowDAStep,
  ): SignTypedDataFlowDAIntermediateValue {
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
        Right: () => SignTypedDataFlowDAInternalState;
        Left: (
          e: SignTypedDataFlowDAError,
        ) => SignTypedDataFlowDAInternalState;
      }) => SignTypedDataFlowDAInternalState;
    },
    internalState: SignTypedDataFlowDAInternalState,
  ): SignTypedDataFlowDAInternalState {
    return output.caseOf({
      Right: () => internalState,
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private normalizeOpenAppError(
    internalState: SignTypedDataFlowDAInternalState,
  ): SignTypedDataFlowDAInternalState {
    const { error } = internalState;
    if (
      error instanceof RefusedByUserDAError ||
      (error instanceof GlobalCommandError && error.errorCode === "5501")
    ) {
      return {
        ...internalState,
        error: new UserRejectedTransactionError("User rejected open app"),
      } as SignTypedDataFlowDAInternalState;
    }
    return internalState;
  }

  private addGetAddressResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (result: { address: string }) => T;
        Left: (e: SignTypedDataFlowDAError) => T;
      }) => T;
    },
    internalState: SignTypedDataFlowDAInternalState,
  ): SignTypedDataFlowDAInternalState {
    return output.caseOf<SignTypedDataFlowDAInternalState>({
      Right: (result) => ({ ...internalState, address: result.address }),
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private addSignResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (result: Signature) => T;
        Left: (e: SignTypedDataFlowDAError) => T;
      }) => T;
    },
    internalState: SignTypedDataFlowDAInternalState,
  ): SignTypedDataFlowDAInternalState {
    return output.caseOf<SignTypedDataFlowDAInternalState>({
      Right: (result) => {
        try {
          return {
            ...internalState,
            signature: getHexaStringFromSignature(result),
          };
        } catch (e) {
          return {
            ...internalState,
            error: new UnknownDAError(
              `Failed to serialize signature: ${e instanceof Error ? e.message : String(e)}`,
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
    _internalState: SignTypedDataFlowDAInternalState;
    input: SignTypedDataFlowDAInput;
  }): SignTypedDataFlowDAInternalState {
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
    internalState: SignTypedDataFlowDAInternalState,
  ): SignTypedDataFlowDAInternalState {
    const { error, lastSignStep } = internalState;
    if (error instanceof EthAppCommandError) {
      if (
        error.errorCode === "6a80" &&
        lastSignStep === SignTypedDataDAStateStep.SIGN_TYPED_DATA_LEGACY
      ) {
        return {
          ...internalState,
          error: new BlindSigningDisabledError("Blind signing disabled"),
        } as SignTypedDataFlowDAInternalState;
      }
      if (error.errorCode === "6985") {
        return {
          ...internalState,
          error: new UserRejectedTransactionError(
            "User rejected typed data signing",
          ),
        } as SignTypedDataFlowDAInternalState;
      }
    }
    return internalState;
  }

  private buildOutput(internalState: SignTypedDataFlowDAInternalState) {
    const { signature, error } = internalState;
    if (signature) {
      return Right({ signature });
    }
    return Left(error || new UnknownDAError("No error in final state"));
  }

  private buildSignFlowStatus(
    interaction: UserInteractionRequired,
    step: SignTypedDataFlowDAStep,
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
