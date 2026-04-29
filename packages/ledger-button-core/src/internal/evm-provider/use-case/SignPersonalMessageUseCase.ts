import { ContextModuleBuilder } from "@ledgerhq/context-module";
import {
  type DeviceActionState,
  DeviceActionStatus,
  type OpenAppWithDependenciesDAInput,
} from "@ledgerhq/device-management-kit";
import { type Factory, inject, injectable } from "inversify";
import { from, map, type Observable, of, switchMap } from "rxjs";

import type {
  SignFlowStatus,
  SignType,
} from "../../../api/model/signing/SignFlowStatus.js";
import type { SignPersonalMessageParams } from "../../../api/model/signing/SignPersonalMessageParams.js";
import { getDerivationPath } from "../../account/AccountUtils.js";
import type { Account } from "../../account/service/AccountService.js";
import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import { DAppConfig } from "../../dAppConfig/dAppConfigTypes.js";
import { dAppConfigModuleTypes } from "../../dAppConfig/di/dAppConfigModuleTypes.js";
import type { DAppConfigService } from "../../dAppConfig/service/DAppConfigService.js";
import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import {
  AccountNotSelectedError,
  DeviceConnectionError,
} from "../../device/model/errors.js";
import type { DeviceManagementKitService } from "../../device/service/DeviceManagementKitService.js";
import { SignPersonalMessageFlowDeviceAction } from "../../device/use-case/device-action/SignPersonalMessageFlowDeviceAction.js";
import type {
  SignPersonalMessageFlowDAError,
  SignPersonalMessageFlowDAIntermediateValue,
  SignPersonalMessageFlowDAOutput,
} from "../../device/use-case/device-action/SignPersonalMessageFlowDeviceActionTypes.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import type { StorageService } from "../../storage/StorageService.js";

@injectable()
export class SignPersonalMessageUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(dAppConfigModuleTypes.DAppConfigService)
    private readonly dappConfigService: DAppConfigService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {
    this.logger = loggerFactory("[SignPersonalMessageUseCase]");
  }

  execute(params: SignPersonalMessageParams): Observable<SignFlowStatus> {
    this.logger.info("Starting signing message", { params });

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

    const [, message] = params;
    const signType: SignType = "personal-sign";

    try {
      const dmk = this.deviceManagementKitService.dmk;

      const selectedAccount: Account | undefined = this.storageService
        .getSelectedAccount()
        .extract();

      if (!selectedAccount) {
        throw new AccountNotSelectedError("No account selected");
      }

      const derivationPath = getDerivationPath(selectedAccount);
      const contextModule = this.createContextModule();

      return from(this.createOpenAppConfig()).pipe(
        switchMap((openAppConfig) => {
          const deviceAction = new SignPersonalMessageFlowDeviceAction({
            input: {
              signType,
              derivationPath,
              message,
              expectedAddress: selectedAccount.freshAddress,
              openAppInput: openAppConfig,
              contextModule,
            },
            inspect: false,
          });

          const { observable } = dmk.executeDeviceAction({
            sessionId,
            deviceAction,
          });

          return observable.pipe(
            map((state) => this.toSignFlowStatus(state, signType)),
          ) as Observable<SignFlowStatus>;
        }),
      );
    } catch (error) {
      this.logger.error("Failed to sign personal message", { error });
      return of({
        signType,
        status: "error" as const,
        error,
      });
    }
  }

  private createContextModule() {
    return new ContextModuleBuilder({
      originToken: this.config.originToken,
    }).build();
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
      requireLatestFirmware: false,
    };
  }

  private toSignFlowStatus(
    state: DeviceActionState<
      SignPersonalMessageFlowDAOutput,
      SignPersonalMessageFlowDAError,
      SignPersonalMessageFlowDAIntermediateValue
    >,
    signType: SignType,
  ): SignFlowStatus {
    switch (state.status) {
      case DeviceActionStatus.Pending:
        return state.intermediateValue.signFlowStatus;

      case DeviceActionStatus.Completed:
        return {
          signType,
          status: "success",
          data: { signature: state.output.signature },
        };

      case DeviceActionStatus.Error:
        return { signType, status: "error", error: state.error };

      default:
        return {
          signType,
          status: "debugging",
          message: `Status: ${(state as { status: string }).status}`,
        };
    }
  }
}
