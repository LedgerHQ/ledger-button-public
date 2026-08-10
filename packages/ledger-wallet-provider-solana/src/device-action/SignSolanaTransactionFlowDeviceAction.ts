import {
  type DeviceActionStateMachine,
  type InternalApi,
  OpenAppWithDependenciesDeviceAction,
  type StateMachineTypes,
  UnknownDAError,
  UserInteractionRequired,
  XStateDeviceAction,
} from "@ledgerhq/device-management-kit";
import {
  GetAddressDeviceActionFactory,
  isSolanaAppError,
  SignTransactionDeviceActionFactory,
} from "@ledgerhq/device-signer-kit-solana";
import type { SignFlowStatus } from "@ledgerhq/ledger-wallet-provider-core";
import type { UserInteractionNeeded } from "@ledgerhq/ledger-wallet-provider-core";
import {
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { Left, Right } from "purify-ts";
import { assign, setup } from "xstate";

import {
  type SignSolanaTransactionFlowDAError,
  type SignSolanaTransactionFlowDAInput,
  type SignSolanaTransactionFlowDAIntermediateValue,
  type SignSolanaTransactionFlowDAInternalState,
  type SignSolanaTransactionFlowDAOutput,
  SignSolanaTransactionFlowDAStep,
} from "./SignSolanaTransactionFlowDeviceActionTypes.js";

/** User rejection APDU status word on the Solana app. */
const USER_REJECTION_ERROR_CODE = "6985";

type ChildDASnapshotContext = {
  readonly intermediateValue: {
    readonly requiredUserInteraction: UserInteractionRequired;
  };
};

export class SignSolanaTransactionFlowDeviceAction extends XStateDeviceAction<
  SignSolanaTransactionFlowDAOutput,
  SignSolanaTransactionFlowDAInput,
  SignSolanaTransactionFlowDAError,
  SignSolanaTransactionFlowDAIntermediateValue,
  SignSolanaTransactionFlowDAInternalState
> {
  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    SignSolanaTransactionFlowDAOutput,
    SignSolanaTransactionFlowDAInput,
    SignSolanaTransactionFlowDAError,
    SignSolanaTransactionFlowDAIntermediateValue,
    SignSolanaTransactionFlowDAInternalState
  > {
    type types = StateMachineTypes<
      SignSolanaTransactionFlowDAOutput,
      SignSolanaTransactionFlowDAInput,
      SignSolanaTransactionFlowDAError,
      SignSolanaTransactionFlowDAIntermediateValue,
      SignSolanaTransactionFlowDAInternalState
    >;

    const openAppDA = new OpenAppWithDependenciesDeviceAction({
      input: this.input.openAppInput,
      inspect: false,
    });

    const getAddressDA = GetAddressDeviceActionFactory({
      derivationPath: this.input.derivationPath,
      checkOnDevice: false,
      skipOpenApp: true,
    });

    const signTransactionDA = SignTransactionDeviceActionFactory({
      input: {
        derivationPath: this.input.derivationPath,
        transaction: this.input.transaction,
        contextModule: this.input.contextModule,
        transactionOptions: { skipOpenApp: true },
      },
      inspect: false,
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
                error: SignSolanaTransactionFlowDAInternalState["error"];
              }
            ).error,
          }),
        }),
      },
    }).createMachine({
      id: "SignSolanaTransactionFlowDeviceAction",
      initial: "OpenApp",
      context: (_) => ({
        input: _.input,
        intermediateValue: {
          requiredUserInteraction: UserInteractionRequired.None,
          step: SignSolanaTransactionFlowDAStep.OPEN_APP,
          signFlowStatus: this.buildSignFlowStatus(
            UserInteractionRequired.None,
            SignSolanaTransactionFlowDAStep.OPEN_APP,
          ),
        },
        _internalState: {
          error: null,
          address: null,
          signature: null,
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
                    SignSolanaTransactionFlowDAStep.OPEN_APP,
                  ),
              }),
            },
            onDone: {
              actions: assign({
                _internalState: ({ event, context }) =>
                  this.addOpenAppResultToInternalState(
                    event.output,
                    context._internalState,
                  ),
              }),
              target: "CheckOpenAppResult",
            },
            onError: {
              actions: "assignErrorFromEvent",
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
                step: SignSolanaTransactionFlowDAStep.GET_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignSolanaTransactionFlowDAStep.GET_ADDRESS,
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
                    SignSolanaTransactionFlowDAStep.GET_ADDRESS,
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
                step: SignSolanaTransactionFlowDAStep.VERIFY_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignSolanaTransactionFlowDAStep.VERIFY_ADDRESS,
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
                requiredUserInteraction:
                  UserInteractionRequired.SignTransaction,
                step: SignSolanaTransactionFlowDAStep.SIGN,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.SignTransaction,
                  SignSolanaTransactionFlowDAStep.SIGN,
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
                    SignSolanaTransactionFlowDAStep.SIGN,
                  ),
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
                this.normalizeRejectionError(context._internalState),
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
    currentIntermediate: SignSolanaTransactionFlowDAIntermediateValue,
    step: SignSolanaTransactionFlowDAStep,
  ): SignSolanaTransactionFlowDAIntermediateValue {
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
        Right: () => SignSolanaTransactionFlowDAInternalState;
        Left: (
          e: SignSolanaTransactionFlowDAError,
        ) => SignSolanaTransactionFlowDAInternalState;
      }) => SignSolanaTransactionFlowDAInternalState;
    },
    internalState: SignSolanaTransactionFlowDAInternalState,
  ): SignSolanaTransactionFlowDAInternalState {
    return output.caseOf({
      Right: () => internalState,
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private addGetAddressResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (address: string) => T;
        Left: (e: SignSolanaTransactionFlowDAError) => T;
      }) => T;
    },
    internalState: SignSolanaTransactionFlowDAInternalState,
  ): SignSolanaTransactionFlowDAInternalState {
    return output.caseOf<SignSolanaTransactionFlowDAInternalState>({
      Right: (address) => ({ ...internalState, address }),
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private addSignResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (signature: Uint8Array) => T;
        Left: (e: SignSolanaTransactionFlowDAError) => T;
      }) => T;
    },
    internalState: SignSolanaTransactionFlowDAInternalState,
  ): SignSolanaTransactionFlowDAInternalState {
    return output.caseOf<SignSolanaTransactionFlowDAInternalState>({
      Right: (signature) => ({ ...internalState, signature }),
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private verifyAddressMatch({
    _internalState,
    input,
  }: {
    _internalState: SignSolanaTransactionFlowDAInternalState;
    input: SignSolanaTransactionFlowDAInput;
  }): SignSolanaTransactionFlowDAInternalState {
    // Solana addresses are base58 and case-sensitive: compare exactly.
    if (_internalState.address !== input.expectedAddress) {
      return {
        ..._internalState,
        error: new IncorrectSeedError("Address mismatch"),
      };
    }
    return _internalState;
  }

  private normalizeRejectionError(
    internalState: SignSolanaTransactionFlowDAInternalState,
  ): SignSolanaTransactionFlowDAInternalState {
    const { error } = internalState;
    if (
      isSolanaAppError(error) &&
      error.errorCode === USER_REJECTION_ERROR_CODE
    ) {
      return {
        ...internalState,
        error: new UserRejectedTransactionError(
          "User rejected transaction signing",
        ),
      } as SignSolanaTransactionFlowDAInternalState;
    }
    return internalState;
  }

  private buildOutput(internalState: SignSolanaTransactionFlowDAInternalState) {
    const { signature, error } = internalState;
    if (signature) {
      return Right({ signature });
    }
    return Left(error || new UnknownDAError("No error in final state"));
  }

  private buildSignFlowStatus(
    interaction: UserInteractionRequired,
    step: SignSolanaTransactionFlowDAStep,
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
