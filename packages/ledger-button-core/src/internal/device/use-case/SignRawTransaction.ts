import {
  DeviceActionStatus,
  hexaStringToBuffer,
  OpenAppWithDependenciesDAInput,
  OpenAppWithDependenciesDAState,
  OpenAppWithDependenciesDeviceAction,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  SignerEthBuilder,
  SignTransactionDAState,
} from "@ledgerhq/device-signer-kit-ethereum";
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
  isSignedTransactionResult,
  isSignedTypedDataResult,
  SignedResults,
} from "../../../api/model/signing/SignedTransaction.js";
import {
  SignFlowStatus,
  SignType,
} from "../../../api/model/signing/SignFlowStatus.js";
import { SignRawTransactionParams } from "../../../api/model/signing/SignRawTransactionParams.js";
import { createSignedTransaction } from "../../../internal/transaction/utils/TransactionHelper.js";
import type { Account } from "../../account/service/AccountService.js";
import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import { DAppConfig } from "../../dAppConfig/dAppConfigTypes.js";
import { dAppConfigModuleTypes } from "../../dAppConfig/di/dAppConfigModuleTypes.js";
import { type DAppConfigService } from "../../dAppConfig/service/DAppConfigService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import type { StorageService } from "../../storage/StorageService.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import {
  AccountNotSelectedError,
  DeviceConnectionError,
  SignTransactionError,
} from "../model/errors.js";
import type { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";
import {
  BroadcastTransaction,
  BroadcastTransactionParams,
} from "./BroadcastTransaction.js";

@injectable()
export class SignRawTransaction {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
    @inject(dAppConfigModuleTypes.DAppConfigService)
    private readonly dappConfigService: DAppConfigService,
    @inject(deviceModuleTypes.BroadcastTransactionUseCase)
    private readonly broadcastTransactionUseCase: BroadcastTransaction,
  ) {
    this.logger = loggerFactory("[SignRawTransaction]");
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

    const { rawTransaction, broadcast } = params;
    const signType = "transaction";

    const resultObservable = new BehaviorSubject<SignFlowStatus>({
      signType,
      status: "debugging",
      message: "Initializing transaction signing",
    });

    try {
      const dmk = this.deviceManagementKitService.dmk;
      const ethSigner = new SignerEthBuilder({
        dmk,
        originToken: this.config.originToken,
        sessionId,
      }).build();

      const tx = hexaStringToBuffer(rawTransaction);
      if (!tx) {
        throw Error("Invalid raw transaction format");
      }

      const selectedAccount: Account | undefined = this.storageService
        .getSelectedAccount()
        .extract();

      if (!selectedAccount) {
        throw new AccountNotSelectedError("No account selected");
      }

      //Craft from dAppConfig the open app config for the openAppWithDependenciesDA
      const initObservable: Observable<OpenAppWithDependenciesDeviceAction> =
        from(this.createOpenAppConfig()).pipe(
          map(
            (openAppConfig) =>
              new OpenAppWithDependenciesDeviceAction({
                input: openAppConfig,
                inspect: false,
              }),
          ),
        );

      const derivationPath = `44'/60'/0'/0/${selectedAccount.index}`;
      console.log("Derivation path", { derivationPath });

      initObservable
        .pipe(
          switchMap(
            (openAppDeviceAction: OpenAppWithDependenciesDeviceAction) => {
              const openObservable = dmk.executeDeviceAction({
                sessionId: sessionId,
                deviceAction: openAppDeviceAction,
              }).observable;
              return openObservable;
            },
          ),
          filter(
            (result: OpenAppWithDependenciesDAState) =>
              result.status !== DeviceActionStatus.Pending ||
              result.intermediateValue?.requiredUserInteraction !==
                UserInteractionRequired.None,
          ),
          tap((result: OpenAppWithDependenciesDAState) => {
            resultObservable.next(
              this.getTransactionResultForEvent(
                result,
                rawTransaction,
                signType,
              ),
            );
          }),
          filter((result: OpenAppWithDependenciesDAState) => {
            return (
              result.status === DeviceActionStatus.Error ||
              result.status === DeviceActionStatus.Completed
            );
          }),
          switchMap((result: OpenAppWithDependenciesDAState) => {
            resultObservable.next({
              signType,
              status: "debugging",
              message: "Starting Sign Transaction DA",
            });
            if (result.status === DeviceActionStatus.Error) {
              throw new Error("Open app with dependencies failed");
            }

            //TODO Check account with Command getAddress(derivation path) and throw error if not matching

            const { observable: signObservable } = ethSigner.signTransaction(
              derivationPath,
              tx,
              {
                skipOpenApp: true,
              },
            );

            return signObservable;
          }),
          filter(
            (result: SignTransactionDAState) =>
              result.status !== DeviceActionStatus.Pending ||
              result.intermediateValue?.requiredUserInteraction !==
                UserInteractionRequired.None,
          ),
          filter((result: SignTransactionDAState) => {
            return (
              result.status === DeviceActionStatus.Error ||
              result.status === DeviceActionStatus.Completed
            );
          }),
          tap((result: SignTransactionDAState) => {
            resultObservable.next(
              this.getTransactionResultForEvent(
                result,
                rawTransaction,
                signType,
              ),
            );
          }),
          switchMap(async (result: SignTransactionDAState) => {
            if (broadcast && result.status === DeviceActionStatus.Completed) {
              const broadcastParams: BroadcastTransactionParams = {
                signature: result.output as Signature,
                rawTransaction,
                currencyId: selectedAccount.currencyId,
              };
              return await this.broadcastTransactionUseCase.execute(
                broadcastParams,
              );
            } else {
              return result;
            }
          }),
        )
        .subscribe({
          next: (result) => {
            resultObservable.next(
              this.getTransactionResultForEvent(
                result,
                rawTransaction,
                signType,
              ),
            );
          },
          error: (error: Error) => {
            console.error("Failed to sign transaction in SignRawTransaction", {
              error,
            });
            resultObservable.next({ signType, status: "error", error: error });
          },
        });

      return resultObservable.asObservable();
    } catch (error) {
      console.error("Failed to sign transaction in SignRawTransaction", {
        error,
      });
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
      | SignTransactionDAState
      | SignedResults,
    rawTx: string,
    signType: SignType,
  ): SignFlowStatus {
    if (isSignedTransactionResult(result) || isSignedTypedDataResult(result)) {
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
      case DeviceActionStatus.Completed:
        console.log("Transaction signing completed", { result });
        if (!("deviceMetadata" in result.output)) {
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
          console.debug("Open app completed", { result });
          return {
            signType,
            status: "debugging",
            message: `App Opened`,
          };
        }
      case DeviceActionStatus.Error:
        console.error("Error signing transaction in SignRawTransaction", {
          error: result.error.toString(),
        });
        return {
          signType,
          status: "error",
          error: new SignTransactionError(
            result.error.toString() ?? "Unknown error",
          ),
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
