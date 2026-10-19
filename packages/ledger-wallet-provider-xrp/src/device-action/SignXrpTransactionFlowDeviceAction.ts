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
  type Address,
  GetAddressDeviceActionFactory,
  SignTransactionDeviceActionFactory,
} from "@ledgerhq/device-signer-kit-xrp";
import {
  IncorrectSeedError,
  type SignFlowStatus,
  type UserInteractionNeeded,
} from "@ledgerhq/ledger-wallet-provider-core";
import { Left, Right } from "purify-ts";
import { assign, setup } from "xstate";

import { serializeForDevice, withSigningFields } from "../utils/xrpTransaction";
import {
  type SignXrpTransactionFlowDAError,
  type SignXrpTransactionFlowDAInput,
  type SignXrpTransactionFlowDAIntermediateValue,
  type SignXrpTransactionFlowDAInternalState,
  type SignXrpTransactionFlowDAOutput,
  SignXrpTransactionFlowDAStep,
} from "./SignXrpTransactionFlowDeviceActionTypes";

type ChildDASnapshotContext = {
  readonly intermediateValue: {
    readonly requiredUserInteraction: UserInteractionRequired;
  };
};

type DAResult<T> = {
  caseOf: <R>(handlers: {
    Right: (value: T) => R;
    Left: (e: SignXrpTransactionFlowDAError) => R;
  }) => R;
};

/**
 * Opens the XRP app, reads the address and public key, checks the address
 * against the selected account, then signs.
 *
 * The bytes sent to the device contain `SigningPubKey`, which is only known
 * after GetAddress. The sign child machine is registered once with empty bytes,
 * and the Sign state passes it the input of a factory built from the real
 * bytes: DMK's `CallTaskInAppDeviceAction` runs the task found in its invoke
 * input, not the one it was constructed with.
 */
export class SignXrpTransactionFlowDeviceAction extends XStateDeviceAction<
  SignXrpTransactionFlowDAOutput,
  SignXrpTransactionFlowDAInput,
  SignXrpTransactionFlowDAError,
  SignXrpTransactionFlowDAIntermediateValue,
  SignXrpTransactionFlowDAInternalState
> {
  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    SignXrpTransactionFlowDAOutput,
    SignXrpTransactionFlowDAInput,
    SignXrpTransactionFlowDAError,
    SignXrpTransactionFlowDAIntermediateValue,
    SignXrpTransactionFlowDAInternalState
  > {
    type types = StateMachineTypes<
      SignXrpTransactionFlowDAOutput,
      SignXrpTransactionFlowDAInput,
      SignXrpTransactionFlowDAError,
      SignXrpTransactionFlowDAIntermediateValue,
      SignXrpTransactionFlowDAInternalState
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
    });

    const signTransactionDA = this.buildSignTransactionDA(
      new Uint8Array(),
      internalApi,
    );

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
                error: SignXrpTransactionFlowDAInternalState["error"];
              }
            ).error,
          }),
        }),
      },
    }).createMachine({
      id: "SignXrpTransactionFlowDeviceAction",
      initial: "OpenApp",
      context: (_) => ({
        input: _.input,
        intermediateValue: this.buildIntermediateValue(
          UserInteractionRequired.None,
          SignXrpTransactionFlowDAStep.OPEN_APP,
        ),
        _internalState: {
          error: null,
          address: null,
          publicKey: null,
          serializedTransaction: null,
          signature: null,
        },
      }),
      states: {
        OpenApp: {
          invoke: {
            id: "openApp",
            src: "openApp",
            input: ({ context }) => ({ ...context.input.openAppInput }),
            onSnapshot: {
              actions: assign({
                intermediateValue: ({ event, context }) =>
                  this.updateIntermediateValue(
                    event.snapshot.context,
                    context.intermediateValue,
                    SignXrpTransactionFlowDAStep.OPEN_APP,
                  ),
              }),
            },
            onDone: {
              actions: assign({
                _internalState: ({ event, context }) =>
                  this.addResultToInternalState(
                    event.output,
                    context._internalState,
                    (state) => state,
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
          always: [{ target: "GetAddress", guard: "hasNoError" }, "Error"],
        },

        GetAddress: {
          entry: assign({
            intermediateValue: this.buildIntermediateValue(
              UserInteractionRequired.None,
              SignXrpTransactionFlowDAStep.GET_ADDRESS,
            ),
          }),
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
                    SignXrpTransactionFlowDAStep.GET_ADDRESS,
                  ),
              }),
            },
            onDone: {
              actions: assign({
                _internalState: ({ event, context }) =>
                  this.addResultToInternalState<Address>(
                    event.output,
                    context._internalState,
                    (state, { address, publicKey }) => ({
                      ...state,
                      address,
                      publicKey,
                    }),
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
          always: [{ target: "VerifyAddress", guard: "hasNoError" }, "Error"],
        },

        VerifyAddress: {
          entry: assign({
            intermediateValue: this.buildIntermediateValue(
              UserInteractionRequired.None,
              SignXrpTransactionFlowDAStep.VERIFY_ADDRESS,
            ),
            _internalState: ({ context }) => this.verifyAddressMatch(context),
          }),
          // `after: { 0 }` instead of `always` so entry actions execute before the guard
          after: {
            0: [
              { target: "PrepareTransaction", guard: "hasNoError" },
              { target: "Error" },
            ],
          },
        },

        PrepareTransaction: {
          entry: assign({
            intermediateValue: this.buildIntermediateValue(
              UserInteractionRequired.None,
              SignXrpTransactionFlowDAStep.PREPARE_TRANSACTION,
            ),
            _internalState: ({ context }) =>
              this.prepareTransaction(context),
          }),
          after: {
            0: [
              { target: "Sign", guard: "hasNoError" },
              { target: "Error" },
            ],
          },
        },

        Sign: {
          entry: assign({
            intermediateValue: this.buildIntermediateValue(
              UserInteractionRequired.SignTransaction,
              SignXrpTransactionFlowDAStep.SIGN,
            ),
          }),
          invoke: {
            id: "signTransaction",
            src: "signTransaction",
            input: ({ context }) =>
              this.buildSignTransactionDA(
                context._internalState.serializedTransaction ??
                  new Uint8Array(),
                internalApi,
              ).input,
            onSnapshot: {
              actions: assign({
                intermediateValue: ({ event, context }) =>
                  this.updateIntermediateValue(
                    event.snapshot.context,
                    context.intermediateValue,
                    SignXrpTransactionFlowDAStep.SIGN,
                  ),
              }),
            },
            onDone: {
              actions: assign({
                _internalState: ({ event, context }) =>
                  this.addResultToInternalState<Uint8Array>(
                    event.output,
                    context._internalState,
                    (state, signature) => ({ ...state, signature }),
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
          always: [{ target: "Success", guard: "hasNoError" }, "Error"],
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

  private buildSignTransactionDA(
    transaction: Uint8Array,
    internalApi: InternalApi,
  ) {
    return SignTransactionDeviceActionFactory({
      derivationPath: this.input.derivationPath,
      transaction,
      skipOpenApp: true,
      loggerFactory: this.getLoggerFactory(internalApi),
    });
  }

  private addResultToInternalState<T>(
    output: DAResult<T>,
    internalState: SignXrpTransactionFlowDAInternalState,
    onSuccess: (
      state: SignXrpTransactionFlowDAInternalState,
      value: T,
    ) => SignXrpTransactionFlowDAInternalState,
  ): SignXrpTransactionFlowDAInternalState {
    return output.caseOf<SignXrpTransactionFlowDAInternalState>({
      Right: (value) => onSuccess(internalState, value),
      Left: (e) => ({
        ...internalState,
        error: e as SignXrpTransactionFlowDAInternalState["error"],
      }),
    });
  }

  private verifyAddressMatch({
    _internalState,
    input,
  }: {
    _internalState: SignXrpTransactionFlowDAInternalState;
    input: SignXrpTransactionFlowDAInput;
  }): SignXrpTransactionFlowDAInternalState {
    // XRP addresses are base58 and case-sensitive: compare exactly.
    if (_internalState.address !== input.expectedAddress) {
      return {
        ..._internalState,
        error: new IncorrectSeedError("Address mismatch"),
      };
    }
    return _internalState;
  }

  private prepareTransaction({
    _internalState,
    input,
  }: {
    _internalState: SignXrpTransactionFlowDAInternalState;
    input: SignXrpTransactionFlowDAInput;
  }): SignXrpTransactionFlowDAInternalState {
    const { address, publicKey } = _internalState;
    if (address === null || publicKey === null) {
      return {
        ..._internalState,
        error: new UnknownDAError("No address read from the device"),
      };
    }
    try {
      const unsigned = withSigningFields(input.transaction, address, publicKey);
      return {
        ..._internalState,
        serializedTransaction: serializeForDevice(unsigned),
      };
    } catch (error) {
      return {
        ..._internalState,
        error: new UnknownDAError(
          error instanceof Error ? error.message : String(error),
        ),
      };
    }
  }

  private updateIntermediateValue(
    childContext: ChildDASnapshotContext,
    currentIntermediate: SignXrpTransactionFlowDAIntermediateValue,
    step: SignXrpTransactionFlowDAStep,
  ): SignXrpTransactionFlowDAIntermediateValue {
    return this.buildIntermediateValue(
      childContext.intermediateValue.requiredUserInteraction ??
        currentIntermediate.requiredUserInteraction,
      step,
    );
  }

  private buildIntermediateValue(
    interaction: UserInteractionRequired,
    step: SignXrpTransactionFlowDAStep,
  ): SignXrpTransactionFlowDAIntermediateValue {
    return {
      requiredUserInteraction: interaction,
      step,
      signFlowStatus: this.buildSignFlowStatus(interaction, step),
    };
  }

  private buildSignFlowStatus(
    interaction: UserInteractionRequired,
    step: SignXrpTransactionFlowDAStep,
  ): SignFlowStatus {
    if (interaction !== UserInteractionRequired.None) {
      return {
        signType: "transaction",
        status: "user-interaction-needed",
        interaction: interaction as UserInteractionNeeded,
      };
    }
    return {
      signType: "transaction",
      status: "debugging",
      message: `Step: ${step}`,
    };
  }

  private buildOutput(internalState: SignXrpTransactionFlowDAInternalState) {
    const { signature, publicKey, error } = internalState;
    if (signature && publicKey) {
      return Right({ signature, signingPubKey: publicKey });
    }
    return Left(error || new UnknownDAError("No error in final state"));
  }
}
