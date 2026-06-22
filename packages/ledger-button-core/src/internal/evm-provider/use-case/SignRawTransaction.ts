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
import { Signature } from "ethers";
import { type Factory, inject, injectable } from "inversify";
import {
  BehaviorSubject,
  filter,
  from,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from "rxjs";

import {
  BlindSigningDisabledError,
  DeviceOutOfStorageError,
  IncorrectSeedError,
  UserRejectedTransactionError,
} from "../../../api/errors/DeviceErrors.js";
import {
  GetAddressDAState,
  isGetAddressResult,
} from "../../../api/model/signing/GetAddress.js";
import {
  isBroadcastedTransactionResult,
  isSignedMessageOrTypedDataResult,
  isSignedTransactionResult,
  type SignedResults,
} from "../../../api/model/signing/SignedTransaction.js";
import {
  SignFlowStatus,
  SignType,
} from "../../../api/model/signing/SignFlowStatus.js";
import { SignRawTransactionParams } from "../../../api/model/signing/SignRawTransactionParams.js";
import { getDerivationPath } from "../../account/AccountUtils.js";
import type { Account } from "../../account/service/AccountService.js";
import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import { DAppConfig } from "../../dAppConfig/v1/dAppConfigTypes.js";
import { dAppConfigV1ModuleTypes } from "../../dAppConfig/v1/di/dAppConfigV1ModuleTypes.js";
import { type DAppConfigService } from "../../dAppConfig/v1/service/DAppConfigService.js";
import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import {
  AccountNotSelectedError,
  DeviceConnectionError,
  SignTransactionError,
} from "../../device/model/errors.js";
import type { DeviceManagementKitService } from "../../device/service/DeviceManagementKitService.js";
import { eventTrackingModuleTypes } from "../../event-tracking/eventTrackingModuleTypes.js";
import { TrackTransactionCompleted } from "../../event-tracking/usecase/TrackTransactionCompleted.js";
import { TrackTransactionStarted } from "../../event-tracking/usecase/TrackTransactionStarted.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { modalModuleTypes } from "../../modal/modalModuleTypes.js";
import { ModalService } from "../../modal/service/ModalService.js";
import { evmProviderModuleTypes } from "../evmProviderModuleTypes.js";
import { createSignedTransaction } from "../transaction/TransactionHelper.js";
import {
  BroadcastTransaction,
  BroadcastTransactionParams,
} from "./BroadcastTransaction.js";
import { BuildEthSigner } from "./BuildEthSigner.js";

type OpenAppResult = {
  result: OpenAppWithDependenciesDAState;
  appName: string;
};

@injectable()
export class SignRawTransaction {
  private readonly logger: LoggerPublisher;
  private pendingStep = "";

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(dAppConfigV1ModuleTypes.DAppConfigService)
    private readonly dappConfigService: DAppConfigService,
    @inject(evmProviderModuleTypes.BroadcastTransactionUseCase)
    private readonly broadcastTransactionUseCase: BroadcastTransaction,
    @inject(evmProviderModuleTypes.BuildEthSignerUseCase)
    private readonly buildEthSigner: BuildEthSigner,
    @inject(eventTrackingModuleTypes.TrackTransactionStarted)
    private readonly trackTransactionStarted: TrackTransactionStarted,
    @inject(eventTrackingModuleTypes.TrackTransactionCompleted)
    private readonly trackTransactionCompleted: TrackTransactionCompleted,
    @inject(modalModuleTypes.ModalService)
    private readonly modalService: ModalService,
  ) {
    this.logger = loggerFactory("SignRawTransaction");
  }

  execute(params: SignRawTransactionParams): Observable<SignFlowStatus> {
    this.logger.info("Starting transaction signing", { params });

    const sessionId = this.deviceManagementKitService.sessionId;

    if (!sessionId) {
      this.logger.error("No device connected");
      throw new DeviceConnectionError(
        "No device connected. Please connect a device first.",
        { type: "not-connected" },
      );
    }

    const device = this.deviceManagementKitService.connectedDevice;
    if (!device) {
      this.logger.error("No connected device found");
      throw new DeviceConnectionError("No connected device found", {
        type: "not-connected",
      });
    }

    const { transaction, broadcast } = params;
    const signType = "transaction";

    const resultObservable = new BehaviorSubject<SignFlowStatus>({
      signType,
      status: "debugging",
      message: "Initializing transaction signing",
    });

    try {
      const dmk = this.deviceManagementKitService.dmk;
      const ethSigner = this.buildEthSigner.execute({
        sessionId,
        chain: ContextModuleChainID.Ethereum,
      });

      const tx = hexaStringToBuffer(transaction);
      if (!tx) {
        throw Error("Invalid raw transaction format");
      }

      const selectedAccount: Account | undefined =
        this.contextService.getContext().selectedAccount;

      if (!selectedAccount) {
        throw new AccountNotSelectedError("No account selected");
      }

      //Craft from dAppConfig the open app config for the openAppWithDependenciesDA
      const initObservable: Observable<{
        deviceAction: OpenAppWithDependenciesDeviceAction;
        appName: string;
      }> = from(this.createOpenAppConfig()).pipe(
        map((openAppConfig) => ({
          deviceAction: new OpenAppWithDependenciesDeviceAction({
            input: openAppConfig,
            inspect: false,
          }),
          appName: openAppConfig.application.name,
        })),
      );

      const derivationPath = getDerivationPath(selectedAccount);

      this.trackTransactionStarted.execute();

      initObservable
        .pipe(
          switchMap(({ deviceAction: openAppDeviceAction, appName }) => {
            const openObservable = dmk.executeDeviceAction({
              sessionId: sessionId,
              deviceAction: openAppDeviceAction,
            }).observable;
            return openObservable.pipe(map((result) => ({ result, appName })));
          }),
          filter(
            ({ result }: OpenAppResult) =>
              result.status !== DeviceActionStatus.Pending ||
              result.intermediateValue?.requiredUserInteraction !==
                UserInteractionRequired.None,
          ),
          tap(({ result }: OpenAppResult) => {
            resultObservable.next(
              this.getTransactionResultForEvent(result, transaction, signType),
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
                (err instanceof GlobalCommandError && err.errorCode === "5501")
              ) {
                throw new UserRejectedTransactionError(
                  "User rejected open app",
                );
              }

              if (err instanceof OutOfMemoryDAError) {
                throw new DeviceOutOfStorageError(
                  "Not enough storage on device to install app",
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
                  throw new BlindSigningDisabledError("Blind signing disabled");
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
            if (broadcast && this.modalService.open) {
              const broadcastParams: BroadcastTransactionParams = {
                signature: result.output as Signature,
                rawTransaction: transaction,
              };
              const broadcastResult =
                await this.broadcastTransactionUseCase.execute(broadcastParams);

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
        )
        .subscribe({
          next: (result) => {
            if (
              isSignedTransactionResult(result) ||
              isBroadcastedTransactionResult(result)
            ) {
              //Only track completion for broadcasted transactions
              if (isBroadcastedTransactionResult(result)) {
                this.trackTransactionCompleted.execute(transaction, result);
              }

              resultObservable.next(
                this.getTransactionResultForEvent(
                  result,
                  transaction,
                  signType,
                ),
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
    } catch (error) {
      this.logger.error("Failed to sign transaction", { error });
      return of({
        signType,
        status: "error",
        error: new SignTransactionError(`Transaction signing failed: ${error}`),
      });
    }
  }

  async createOpenAppConfig(): Promise<OpenAppWithDependenciesDAInput> {
    const dAppConfig: DAppConfig = await this.dappConfigService.getDAppConfig();

    const ethereumAppDependencies = dAppConfig.appDependencies.find(
      (dep) => dep.blockchain === "ethereum",
    );
    if (!ethereumAppDependencies) {
      throw new Error("Ethereum Blockchain dependencies not found");
    }

    return {
      application: { name: ethereumAppDependencies.appName },
      dependencies: ethereumAppDependencies.dependencies.map((dep) => ({
        name: dep,
      })),
      requireLatestFirmware: false, //TODO add this to the dApp config
    };
  }

  private getTransactionResultForEvent(
    result:
      | OpenAppWithDependenciesDAState
      | GetAddressDAState
      | SignTransactionDAState
      | SignedResults,
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
