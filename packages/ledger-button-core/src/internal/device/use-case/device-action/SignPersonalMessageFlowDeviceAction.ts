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
  type Signature,
  SignPersonalMessageDeviceActionFactory,
} from "@ledgerhq/device-signer-kit-ethereum";
import { EthAppCommandError } from "@ledgerhq/device-signer-kit-ethereum/internal/app-binder/command/utils/ethAppErrors.js";
import { Left, Right } from "purify-ts";
import { assign, setup } from "xstate";

import {
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "../../../../api/errors/DeviceErrors.js";
import type { SignFlowStatus } from "../../../../api/model/signing/SignFlowStatus.js";
import type { UserInteractionNeeded } from "../../../../api/model/UserInteractionNeeded.js";
import { getHexaStringFromSignature } from "../../../transaction/utils/TransactionHelper.js";
import {
  type SignPersonalMessageFlowDAError,
  type SignPersonalMessageFlowDAInput,
  type SignPersonalMessageFlowDAIntermediateValue,
  type SignPersonalMessageFlowDAInternalState,
  type SignPersonalMessageFlowDAOutput,
  SignPersonalMessageFlowDAStep,
} from "./SignPersonalMessageFlowDeviceActionTypes.js";

type ChildDASnapshotContext = {
  readonly intermediateValue: {
    readonly requiredUserInteraction: UserInteractionRequired;
  };
};

export class SignPersonalMessageFlowDeviceAction extends XStateDeviceAction<
  SignPersonalMessageFlowDAOutput,
  SignPersonalMessageFlowDAInput,
  SignPersonalMessageFlowDAError,
  SignPersonalMessageFlowDAIntermediateValue,
  SignPersonalMessageFlowDAInternalState
> {
  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    SignPersonalMessageFlowDAOutput,
    SignPersonalMessageFlowDAInput,
    SignPersonalMessageFlowDAError,
    SignPersonalMessageFlowDAIntermediateValue,
    SignPersonalMessageFlowDAInternalState
  > {
    type types = StateMachineTypes<
      SignPersonalMessageFlowDAOutput,
      SignPersonalMessageFlowDAInput,
      SignPersonalMessageFlowDAError,
      SignPersonalMessageFlowDAIntermediateValue,
      SignPersonalMessageFlowDAInternalState
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

    const signMessageDA = SignPersonalMessageDeviceActionFactory({
      derivationPath: this.input.derivationPath,
      message: this.input.message,
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
                error: SignPersonalMessageFlowDAInternalState["error"];
              }
            ).error,
          }),
        }),
      },
    }).createMachine({
      id: "SignPersonalMessageFlowDeviceAction",
      initial: "OpenApp",
      context: (_) => ({
        input: _.input,
        intermediateValue: {
          requiredUserInteraction: UserInteractionRequired.None,
          step: SignPersonalMessageFlowDAStep.OPEN_APP,
          signFlowStatus: this.buildSignFlowStatus(
            UserInteractionRequired.None,
            SignPersonalMessageFlowDAStep.OPEN_APP,
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
                    SignPersonalMessageFlowDAStep.OPEN_APP,
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
                step: SignPersonalMessageFlowDAStep.GET_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignPersonalMessageFlowDAStep.GET_ADDRESS,
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
                    SignPersonalMessageFlowDAStep.GET_ADDRESS,
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
                step: SignPersonalMessageFlowDAStep.VERIFY_ADDRESS,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.None,
                  SignPersonalMessageFlowDAStep.VERIFY_ADDRESS,
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
                step: SignPersonalMessageFlowDAStep.SIGN,
                signFlowStatus: this.buildSignFlowStatus(
                  UserInteractionRequired.SignPersonalMessage,
                  SignPersonalMessageFlowDAStep.SIGN,
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
                    SignPersonalMessageFlowDAStep.SIGN,
                  ),
              }),
            },
            onDone: {
              actions: assign({
                _internalState: ({ event, context }) =>
                  this.addSignResultToInternalState(event.output, context._internalState),
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
    currentIntermediate: SignPersonalMessageFlowDAIntermediateValue,
    step: SignPersonalMessageFlowDAStep,
  ): SignPersonalMessageFlowDAIntermediateValue {
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
        Right: () => SignPersonalMessageFlowDAInternalState;
        Left: (
          e: SignPersonalMessageFlowDAError,
        ) => SignPersonalMessageFlowDAInternalState;
      }) => SignPersonalMessageFlowDAInternalState;
    },
    internalState: SignPersonalMessageFlowDAInternalState,
  ): SignPersonalMessageFlowDAInternalState {
    return output.caseOf({
      Right: () => internalState,
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private addGetAddressResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (result: { address: string }) => T;
        Left: (e: SignPersonalMessageFlowDAError) => T;
      }) => T;
    },
    internalState: SignPersonalMessageFlowDAInternalState,
  ): SignPersonalMessageFlowDAInternalState {
    return output.caseOf<SignPersonalMessageFlowDAInternalState>({
      Right: (result) => ({ ...internalState, address: result.address }),
      Left: (e) => ({ ...internalState, error: e }),
    });
  }

  private addSignResultToInternalState(
    output: {
      caseOf: <T>(handlers: {
        Right: (result: Signature) => T;
        Left: (e: SignPersonalMessageFlowDAError) => T;
      }) => T;
    },
    internalState: SignPersonalMessageFlowDAInternalState,
  ): SignPersonalMessageFlowDAInternalState {
    return output.caseOf<SignPersonalMessageFlowDAInternalState>({
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
    _internalState: SignPersonalMessageFlowDAInternalState;
    input: SignPersonalMessageFlowDAInput;
  }): SignPersonalMessageFlowDAInternalState {
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

  private normalizeRejectionError(
    internalState: SignPersonalMessageFlowDAInternalState,
  ): SignPersonalMessageFlowDAInternalState {
    const { error } = internalState;
    if (error instanceof EthAppCommandError && error.errorCode === "6985") {
      return {
        ...internalState,
        error: new UserRejectedTransactionError(
          "User rejected message signing",
        ),
      } as SignPersonalMessageFlowDAInternalState;
    }
    return internalState;
  }

  private buildOutput(internalState: SignPersonalMessageFlowDAInternalState) {
    const { signature, error } = internalState;
    if (signature) {
      return Right({ signature });
    }
    return Left(error || new UnknownDAError("No error in final state"));
  }

  private buildSignFlowStatus(
    interaction: UserInteractionRequired,
    step: SignPersonalMessageFlowDAStep,
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
