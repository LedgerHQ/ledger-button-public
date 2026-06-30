import { ContextModuleChainID } from "@ledgerhq/context-module";
import {
  DeviceActionStatus,
  GlobalCommandError,
  OpenAppWithDependenciesDAInput,
  type OpenAppWithDependenciesDAState,
  OpenAppWithDependenciesDeviceAction,
  OutOfMemoryDAError,
  RefusedByUserDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  SignTransactionDAStep,
  type SignTypedDataDAState,
} from "@ledgerhq/device-signer-kit-ethereum";
import { EthAppCommandError } from "@ledgerhq/device-signer-kit-ethereum/internal/app-binder/command/utils/ethAppErrors.js";
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

import type { CoreFacade } from "../../../../api/blockchain-provider/model/CoreFacade.js";
import {
  BlindSigningDisabledError,
  DeviceOutOfMemoryError,
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "../../../../api/errors/DeviceErrors.js";
import { AccountNotSelectedError } from "../../../../api/errors/DeviceFlowErrors.js";
import type { ProviderAccount } from "../../../../api/model/blockchain/ProviderAccount.js";
import type { ProviderLogger } from "../../../../api/model/blockchain/ProviderLogger.js";
import type { BlockchainConfig } from "../../../../api/model/dappConfig/BlockchainConfig.js";
import {
  type GetAddressDAState,
  isGetAddressResult,
} from "../../../../api/model/signing/GetAddress.js";
import {
  isSignedMessageOrTypedDataResult,
  type SignedPersonalMessageOrTypedDataResult,
} from "../../../../api/model/signing/SignedTransaction.js";
import type {
  SignFlowStatus,
  SignType,
} from "../../../../api/model/signing/SignFlowStatus.js";
import type { SignTypedMessageParams } from "../../../../api/model/signing/SignTypedMessageParams.js";
import { evmProviderModuleTypes } from "../../evmProviderModuleTypes.js";
import { getHexaStringFromSignature } from "../transaction/TransactionHelper.js";
import { getEvmDerivationPath } from "../utils/derivationUtils.js";
import { waitForDeviceSession } from "../utils/waitForDeviceSession.js";
import { BuildEthSigner } from "./BuildEthSigner.js";

type OpenAppResult = {
  result: OpenAppWithDependenciesDAState;
  appName: string;
};

@injectable()
export class SignTypedData {
  private readonly logger: ProviderLogger;
  private pendingStep = "";

  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
    @inject(evmProviderModuleTypes.BlockchainConfig)
    private readonly blockchainConfig: BlockchainConfig,
    @inject(evmProviderModuleTypes.BuildEthSignerUseCase)
    private readonly buildEthSigner: BuildEthSigner,
  ) {
    this.logger = this.core.getLogger("SignTypedData");
  }

  execute(
    params: SignTypedMessageParams,
    selectedAccount: ProviderAccount | undefined,
  ): Observable<SignFlowStatus> {
    this.logger.info("Starting transaction signing", { params });
    const [, typedData] = params;

    this.core.trackTypedMessageStarted(typedData);

    const signType = "typed-message";

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
                this.getTransactionResultForEvent(result, signType),
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
                message: "Starting Sign Typed Data DA",
              });

              const { observable: signObservable } = ethSigner.signTypedData(
                derivationPath,
                typedData,
                {
                  skipOpenApp: true,
                },
              );

              return signObservable.pipe(
                tap((result: SignTypedDataDAState) => {
                  if (result.status === DeviceActionStatus.Pending) {
                    this.pendingStep = result.intermediateValue?.step ?? "";
                  }

                  if (
                    result.status !== DeviceActionStatus.Completed &&
                    result.status !== DeviceActionStatus.Error
                  ) {
                    resultObservable.next(
                      this.getTransactionResultForEvent(result, signType),
                    );
                  }
                }),
              );
            }),
            filter(
              (result: SignTypedDataDAState) =>
                result.status !== DeviceActionStatus.Pending ||
                result.intermediateValue?.requiredUserInteraction !==
                  UserInteractionRequired.None,
            ),
            filter((result: SignTypedDataDAState) => {
              return (
                result.status === DeviceActionStatus.Error ||
                result.status === DeviceActionStatus.Completed
              );
            }),
            map((result: SignTypedDataDAState) => {
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

              // Track typed message flow successfully completed
              this.core.trackTypedMessageCompleted(typedData);

              return result;
            }),
          );
        }),
      )
      .subscribe({
        next: (result) => {
          resultObservable.next(
            this.getTransactionResultForEvent(result, signType),
          );
        },
        error: (error: Error) => {
          this.logger.error("Typed data signing failed", { error });
          resultObservable.next({ signType, status: "error", error: error });
        },
      });

    return resultObservable.asObservable();
  }

  createOpenAppConfig(): OpenAppWithDependenciesDAInput {
    const { appName, dependencies } = this.blockchainConfig.appDependencies;
    return {
      application: { name: appName },
      dependencies: dependencies.map((name) => ({ name })),
      requireLatestFirmware: false,
    };
  }

  private getTransactionResultForEvent(
    result:
      | OpenAppWithDependenciesDAState
      | SignTypedDataDAState
      | GetAddressDAState
      | SignedPersonalMessageOrTypedDataResult,
    signType: SignType,
  ): SignFlowStatus {
    if (isSignedMessageOrTypedDataResult(result)) {
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
          case "sign-typed-data":
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

        if (!("deviceMetadata" in result.output)) {
          return {
            signType,
            status: "success",
            data: {
              signature: getHexaStringFromSignature(result.output),
            },
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
          error: result.error,
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
