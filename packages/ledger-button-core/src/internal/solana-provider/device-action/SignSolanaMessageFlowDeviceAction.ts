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
  SignMessageDeviceActionFactory,
  SignMessageVersion,
} from "@ledgerhq/device-signer-kit-solana";
import { Left, Right } from "purify-ts";
import { assign, setup } from "xstate";

import { IncorrectSeedError } from "../../../api/errors/DeviceErrors.js";
import type { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import type { UserInteractionNeeded } from "../../../api/model/UserInteractionNeeded.js";
import {
  extractRawSignatureBase58,
  extractSignedMessage,
  normalizeSigningError,
} from "../use-case/solanaSignFlowUtils.js";
import {
  type SignSolanaMessageFlowDAError,
  type SignSolanaMessageFlowDAInput,
  type SignSolanaMessageFlowDAIntermediateValue,
  type SignSolanaMessageFlowDAInternalState,
  type SignSolanaMessageFlowDAOutput,
  SignSolanaMessageFlowDAStep,
} from "./SignSolanaMessageFlowDeviceActionTypes.js";

type ChildDASnapshotContext = {
  readonly intermediateValue: {
    readonly requiredUserInteraction: UserInteractionRequired;
  };
};

export class SignSolanaMessageFlowDeviceAction extends XStateDeviceAction<
  SignSolanaMessageFlowDAOutput,
  SignSolanaMessageFlowDAInput,
  SignSolanaMessageFlowDAError,
  SignSolanaMessageFlowDAIntermediateValue,
  SignSolanaMessageFlowDAInternalState
> {
  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    SignSolanaMessageFlowDAOutput,
    SignSolanaMessageFlowDAInput,
    SignSolanaMessageFlowDAError,
    SignSolanaMessageFlowDAIntermediateValue,
    SignSolanaMessageFlowDAInternalState
  > {
    type types = StateMachineTypes<
      SignSolanaMessageFlowDAOutput,
      SignSolanaMessageFlowDAInput,
      SignSolanaMessageFlowDAError,
      SignSolanaMessageFlowDAIntermediateValue,
      SignSolanaMessageFlowDAInternalState
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

    const signMessageDA = SignMessageDeviceActionFactory({
      derivationPath: this.input.derivationPath,
      message: this.input.message,
      skipOpenApp: true,
      version: SignMessageVersion.V1,
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
        signMessage: signMessageDA.makeStateMachine(internalApi),
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
                error: SignSolanaMessageFlowDAInternalState["error"];
              }
            ).error,
          }),
        }),
      },
    }).createMachine({
      id: "SignSolanaMessageFlowDeviceAction",
      initial: "OpenApp",
      context: (_) => ({
        input: _.input,
        intermediateValue: {
          requiredUserInteraction: UserInteractionRequired.None,
          step: SignSolanaMessageFlowDAStep.OPEN_APP,
          signFlowStatus: this.buildSignFlowStatus(
            UserInteractionRequired.None,
            SignSolanaMessageFlowDAStep.OPEN_APP,
          ),
        },
        _internalState: {
          error: null,
          address: null,
          signature: null,
          signedMessage: null,
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
                    SignSolanaMessageFlowDAStep.OPEN_APP,
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
                step: SignSolanaMessageFlowDAStep.GET_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignSolanaMessageFlowDAStep.GET_ADDRESS,
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
                    SignSolanaMessageFlowDAStep.GET_ADDRESS,
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
                step: SignSolanaMessageFlowDAStep.VERIFY_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignSolanaMessageFlowDAStep.VERIFY_ADDRESS,
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
                  UserInteractionRequired.SignPersonalMessage,
                step: SignSolanaMessageFlowDAStep.SIGN,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.SignPersonalMessage,
                  SignSolanaMessageFlowDAStep.SIGN,
                ),
              },
            }),
          ],
          invoke: {
            id: "signMessage",
            src: "signMessage",
            input: signMessageDA.input,
            onSnapshot: {
              actions: assign({
                intermediateValue: ({ event, context }) =>
                  this.updateIntermediateValue(
                    event.snapshot.context,
                    context.intermediateValue,
                    SignSolanaMessageFlowDAStep.SIGN,
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
    currentIntermediate: SignSolanaMessageFlowDAIntermediateValue,
    step: SignSolanaMessageFlowDAStep,
  ): SignSolanaMessageFlowDAIntermediateValue {
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
        Right: () => SignSolanaMessageFlowDAInternalState;
        Left: (
          e: SignSolanaMessageFlowDAError,
        ) => SignSolanaMessageFlowDAInternalState;
      }) => SignSolanaMessageFlowDAInternalState;
    },
    internalState: SignSolanaMessageFlowDAInternalState,
  ): SignSolanaMessageFlowDAInternalState {
    return output.caseOf({
      Right: () => internalState,
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private addGetAddressResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (address: string) => T;
        Left: (e: SignSolanaMessageFlowDAError) => T;
      }) => T;
    },
    internalState: SignSolanaMessageFlowDAInternalState,
  ): SignSolanaMessageFlowDAInternalState {
    return output.caseOf<SignSolanaMessageFlowDAInternalState>({
      Right: (address) => ({ ...internalState, address }),
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private addSignResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (result: { signature: string }) => T;
        Left: (e: SignSolanaMessageFlowDAError) => T;
      }) => T;
    },
    internalState: SignSolanaMessageFlowDAInternalState,
  ): SignSolanaMessageFlowDAInternalState {
    return output.caseOf<SignSolanaMessageFlowDAInternalState>({
      Right: (result) => {
        try {
          return {
            ...internalState,
            signature: extractRawSignatureBase58(result.signature),
            signedMessage: extractSignedMessage(result.signature),
          };
        } catch (e) {
          return {
            ...internalState,
            error: new UnknownDAError(
              `Failed to parse signature: ${e instanceof Error ? e.message : String(e)}`,
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
    _internalState: SignSolanaMessageFlowDAInternalState;
    input: SignSolanaMessageFlowDAInput;
  }): SignSolanaMessageFlowDAInternalState {
    // Solana addresses are base58 and case-sensitive (unlike EVM hex addresses).
    if (_internalState.address !== input.expectedAddress) {
      return {
        ..._internalState,
        error: new IncorrectSeedError("Address mismatch"),
      };
    }
    return _internalState;
  }

  private normalizeRejectionError(
    internalState: SignSolanaMessageFlowDAInternalState,
  ): SignSolanaMessageFlowDAInternalState {
    const normalized = normalizeSigningError(internalState.error);
    if (normalized !== internalState.error) {
      return {
        ...internalState,
        error: normalized as SignSolanaMessageFlowDAInternalState["error"],
      };
    }
    return internalState;
  }

  private buildOutput(internalState: SignSolanaMessageFlowDAInternalState) {
    const { signature, signedMessage, error } = internalState;
    if (signature && signedMessage) {
      return Right({ signature, signedMessage });
    }
    return Left(error || new UnknownDAError("No error in final state"));
  }

  private buildSignFlowStatus(
    interaction: UserInteractionRequired,
    step: SignSolanaMessageFlowDAStep,
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
