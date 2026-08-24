import { ContextModuleChainID } from "@ledgerhq/context-module";
import {
  DeviceActionStatus,
  GlobalCommandError,
  hexaStringToBuffer,
  OpenAppWithDependenciesDAInput,
  OpenAppWithDependenciesDAState,
  OpenAppWithDependenciesDeviceAction,
  OutOfMemoryDAError,
  RefusedByUserDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  SignTransactionDAState,
  SignTransactionDAStep,
} from "@ledgerhq/device-signer-kit-ethereum";
import { EthAppCommandError } from "@ledgerhq/device-signer-kit-ethereum/internal/app-binder/command/utils/ethAppErrors.js";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderLogger } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import {
  BlindSigningDisabledError,
  DeviceOutOfMemoryError,
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { AccountNotSelectedError } from "@ledgerhq/ledger-wallet-provider-core";
import {
  isBroadcastedTransactionResult,
  isSignedMessageOrTypedDataResult,
  isSignedTransactionResult,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  SignFlowStatus,
  SignType,
} from "@ledgerhq/ledger-wallet-provider-core";
import { waitForDeviceSession } from "@ledgerhq/ledger-wallet-provider-core";
import { Signature } from "ethers";
import { inject, injectable } from "inversify";
import {
  BehaviorSubject,
  filter,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from "rxjs";

import { evmProviderModuleTypes } from "../di/evmProviderModuleTypes";
import type { EvmSignedResult } from "../model/EvmSignedResult";
import {
  GetAddressDAState,
  isGetAddressResult,
} from "../model/GetAddress";
import type { SignRawTransactionParams } from "../model/SignRawTransactionParams";
import { createSignedTransaction } from "../transaction/TransactionHelper";
import { getEvmDerivationPath } from "../utils/derivationUtils";
import {
  BroadcastTransaction,
  BroadcastTransactionParams,
} from "./BroadcastTransaction";
import { BuildEthSigner } from "./BuildEthSigner";

type OpenAppResult = {
  result: OpenAppWithDependenciesDAState;
  appName: string;
};

@injectable()
export class SignRawTransaction {
  private readonly logger: ProviderLogger;
  private pendingStep = "";

  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(evmProviderModuleTypes.BlockchainConfig)
    private readonly blockchainConfig: BlockchainConfig,
    @inject(evmProviderModuleTypes.BroadcastTransactionUseCase)
    private readonly broadcastTransactionUseCase: BroadcastTransaction,
    @inject(evmProviderModuleTypes.BuildEthSignerUseCase)
    private readonly buildEthSigner: BuildEthSigner,
  ) {
    this.logger = this.core.getLogger("SignRawTransaction");
  }

  execute(
    params: SignRawTransactionParams,
    selectedAccount: ProviderAccount | undefined,
  ): Observable<SignFlowStatus> {
    this.logger.info("Starting transaction signing", { params });

    const { transaction, broadcast } = params;
    const signType = "transaction";

    const resultObservable = new BehaviorSubject<SignFlowStatus>({
      signType,
      status: "debugging",
      message: "Initializing transaction signing",
    });

    waitForDeviceSession(this.core)
      .pipe(
        switchMap((session) => {
          const sessionId = session.sessionId;
          const dmk = session.dmk;
          const ethSigner = this.buildEthSigner.execute({
            sessionId,
            chain: ContextModuleChainID.Ethereum,
          });

          const tx = hexaStringToBuffer(transaction);
          if (!tx) {
            throw Error("Invalid raw transaction format");
          }

          if (!selectedAccount) {
            throw new AccountNotSelectedError("No account selected");
          }

          //Craft from dAppConfig the open app config for the openAppWithDependenciesDA
          const initObservable: Observable<{
            deviceAction: OpenAppWithDependenciesDeviceAction;
            appName: string;
          }> = of(this.createOpenAppConfig()).pipe(
            map((openAppConfig) => ({
              deviceAction: new OpenAppWithDependenciesDeviceAction({
                input: openAppConfig,
                inspect: false,
              }),
              appName: openAppConfig.application.name,
            })),
          );

          const derivationPath = getEvmDerivationPath(selectedAccount);

          this.core.trackTransactionStarted();

          return initObservable.pipe(
            switchMap(({ deviceAction: openAppDeviceAction, appName }) => {
              const openObservable = dmk.executeDeviceAction({
                sessionId: sessionId,
                deviceAction: openAppDeviceAction,
              }).observable;
              return openObservable.pipe(
                map((result) => ({ result, appName })),
              );
            }),
            filter(
              ({ result }: OpenAppResult) =>
                result.status !== DeviceActionStatus.Pending ||
                result.intermediateValue?.requiredUserInteraction !==
                  UserInteractionRequired.None,
            ),
            tap(({ result }: OpenAppResult) => {
              resultObservable.next(
                this.getTransactionResultForEvent(
                  result,
                  transaction,
                  signType,
                ),
              );
            }),
            filter(
              ({ result }: OpenAppResult) =>
                result.status === DeviceActionStatus.Error ||
                result.status === DeviceActionStatus.Completed,
            ),
            switchMap(({ result, appName }: OpenAppResult) => {
              if (result.status === DeviceActionStatus.Error) {
                const err = result.error;
                if (
                  err instanceof RefusedByUserDAError ||
                  (err instanceof GlobalCommandError &&
                    err.errorCode === "5501")
                ) {
                  throw new UserRejectedTransactionError(
                    "User rejected open app",
                  );
                }

                if (err instanceof OutOfMemoryDAError) {
                  throw new DeviceOutOfMemoryError(
                    "Not enough memory on device to process the request",
                    { appName },
                  );
                }

                throw new Error("Open app with dependencies failed");
              }

              const { observable: addressObservable } = ethSigner.getAddress(
                derivationPath,
                {
                  skipOpenApp: true,
                },
              );

              return addressObservable.pipe(
                filter((result: GetAddressDAState) => {
                  return (
                    result.status === DeviceActionStatus.Error ||
                    result.status === DeviceActionStatus.Completed
                  );
                }),
              );
            }),
            switchMap((result: GetAddressDAState) => {
              if (result.status === DeviceActionStatus.Error) {
                // TODO: Add error code
                throw result.error;
              }

              if (
                result.status === DeviceActionStatus.Completed &&
                result.output.address.toLowerCase() !==
                  selectedAccount.freshAddress.toLowerCase()
              ) {
                throw new IncorrectSeedError("Address mismatch");
              }

              resultObservable.next({
                signType,
                status: "debugging",
                message: "Starting Sign Transaction DA",
              });

              const { observable: signObservable } = ethSigner.signTransaction(
                derivationPath,
                tx,
                {
                  skipOpenApp: true,
                },
              );

              return signObservable.pipe(
                tap((result: SignTransactionDAState) => {
                  if (result.status === DeviceActionStatus.Pending) {
                    this.pendingStep = result.intermediateValue?.step ?? "";
                  }
                }),
              );
            }),
            filter(
              (result: SignTransactionDAState) =>
                result.status !== DeviceActionStatus.Pending ||
                result.intermediateValue?.requiredUserInteraction !==
                  UserInteractionRequired.None,
            ),
            tap((result: SignTransactionDAState) => {
              if (
                result.status !== DeviceActionStatus.Completed &&
                result.status !== DeviceActionStatus.Error
              ) {
                resultObservable.next(
                  this.getTransactionResultForEvent(
                    result,
                    transaction,
                    signType,
                  ),
                );
              }
            }),
            filter((result: SignTransactionDAState) => {
              return (
                result.status === DeviceActionStatus.Error ||
                result.status === DeviceActionStatus.Completed
              );
            }),
            map((result: SignTransactionDAState) => {
              if (result.status === DeviceActionStatus.Error) {
                switch (true) {
                  case result.error instanceof EthAppCommandError &&
                    result.error.errorCode === "6a80" &&
                    this.pendingStep ===
                      SignTransactionDAStep.BLIND_SIGN_TRANSACTION_FALLBACK:
                    throw new BlindSigningDisabledError(
                      "Blind signing disabled",
                    );
                  case result.error instanceof EthAppCommandError &&
                    result.error.errorCode === "6985":
                    throw new UserRejectedTransactionError(
                      "User rejected transaction",
                    );
                  default:
                    throw result.error;
                }
              }

              return result;
            }),
            filter((result: SignTransactionDAState) => {
              return result.status === DeviceActionStatus.Completed;
            }),
            switchMap(async (result) => {
              //Broadcast TX
              if (broadcast && this.core.isModalOpen()) {
                const broadcastParams: BroadcastTransactionParams = {
                  signature: result.output as Signature,
                  rawTransaction: transaction,
                };
                const broadcastResult =
                  await this.broadcastTransactionUseCase.execute(
                    broadcastParams,
                  );

                return broadcastResult;
              }

              // No Broadcast TX
              const signedTx = createSignedTransaction(transaction, {
                r: result.output.r,
                s: result.output.s,
                v: result.output.v,
              } as Signature);

              return signedTx;
            }),
          );
        }),
      )
      .subscribe({
        next: (result) => {
          if (
            isSignedTransactionResult(result) ||
            isBroadcastedTransactionResult(result)
          ) {
            //Only track completion for broadcasted transactions
            if (isBroadcastedTransactionResult(result)) {
              this.core.trackTransactionCompleted(transaction, result);
            }

            resultObservable.next(
              this.getTransactionResultForEvent(result, transaction, signType),
            );
          }
        },
        error: (error) => {
          this.logger.error("Transaction signing failed", { error });
          resultObservable.next({
            signType,
            status: "error",
            error: error,
          });
        },
      });

    return resultObservable.asObservable();
  }

  createOpenAppConfig(): OpenAppWithDependenciesDAInput {
    const { appName, dependencies } = this.blockchainConfig.appDependencies;
    return {
      application: { name: appName },
      dependencies: dependencies.map(({ name }) => ({ name })),
      requireLatestFirmware: false, //TODO add this to the dApp config
    };
  }

  private getTransactionResultForEvent(
    result:
      | OpenAppWithDependenciesDAState
      | GetAddressDAState
      | SignTransactionDAState
      | EvmSignedResult,
    rawTx: string,
    signType: SignType,
  ): SignFlowStatus {
    if (
      isSignedTransactionResult(result) ||
      isSignedMessageOrTypedDataResult(result)
    ) {
      return {
        signType,
        status: "success",
        data: result,
      };
    }

    switch (result.status) {
      case DeviceActionStatus.Pending:
        switch (result.intermediateValue?.requiredUserInteraction) {
          case "unlock-device":
            return {
              signType,
              status: "user-interaction-needed",
              interaction: "unlock-device",
            };
          case "allow-secure-connection":
            return {
              signType,
              status: "user-interaction-needed",
              interaction: "allow-secure-connection",
            };
          case "confirm-open-app":
            return {
              signType,
              status: "user-interaction-needed",
              interaction: "confirm-open-app",
            };
          case "sign-transaction":
            return {
              signType,
              status: "user-interaction-needed",
              interaction: "sign-transaction",
            };
          case "allow-list-apps":
            return {
              signType,
              status: "user-interaction-needed",
              interaction: "allow-list-apps",
            };
          case "web3-checks-opt-in":
            return {
              signType,
              status: "user-interaction-needed",
              interaction: "web3-checks-opt-in",
            };
          default:
            return {
              signType,
              status: "debugging",
              message: `Unhandled user interaction: ${JSON.stringify(result.intermediateValue?.requiredUserInteraction)}`,
            };
        }
      case DeviceActionStatus.Completed: {
        if (isGetAddressResult(result)) {
          return {
            signType,
            status: "debugging",
            message: `Got address: ${result.output.address}`,
          };
        }

        if ("r" in result.output) {
          const signedTransaction = createSignedTransaction(rawTx, {
            r: result.output.r,
            s: result.output.s,
            v: result.output.v,
          } as Signature);
          return {
            signType,
            status: "success",
            data: signedTransaction,
          };
        } else {
          return {
            signType,
            status: "debugging",
            message: `App Opened`,
          };
        }
      }
      case DeviceActionStatus.Error:
        return {
          signType,
          status: "error",
          error: result,
        };
      default:
        return {
          signType,
          status: "debugging",
          message: `DA status: ${result.status} - ${JSON.stringify(result)}`,
        };
    }
  }
}
