import {
  hexaStringToBuffer,
  OpenAppWithDependenciesDeviceAction,
} from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { type Factory, inject, injectable } from "inversify";
import { EitherAsync, Left, Right } from "purify-ts";
import { lastValueFrom } from "rxjs";
import { keccak256 } from "viem";

import type { Account } from "../../account/service/AccountService.js";
import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import { dAppConfigModuleTypes } from "../../dAppConfig/dAppConfigModuleTypes.js";
import { type DAppConfigService } from "../../dAppConfig/DAppConfigService.js";
import { DAppConfig, DAppConfigError } from "../../dAppConfig/types.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import type { StorageService } from "../../storage/StorageService.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import {
  AccountNotSelectedError,
  DeviceConnectionError,
  FailToOpenAppError,
  SignTransactionError,
} from "../model/errors.js";
import type { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";

export interface SignRawTransactionParams {
  rawTransaction: string;
}

export interface SignedTransaction {
  hash: string;
  rawTransaction: string;
}

@injectable()
export class SignRawTransaction {
  private readonly logger: LoggerPublisher;
  private readonly appDependencies: EitherAsync<
    DAppConfigError,
    DAppConfig["appDependencies"]
  >;

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
    dappConfigService: DAppConfigService,
  ) {
    this.logger = loggerFactory("[SignRawTransaction]");
    this.appDependencies = dappConfigService.get("appDependencies");
  }

  async execute(params: SignRawTransactionParams): Promise<SignedTransaction> {
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

    const { rawTransaction } = params;

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

      const account: Account | undefined = this.storageService
        .getSelectedAccount()
        .extract();

      if (!account) {
        throw new AccountNotSelectedError("No account selected");
      }

      const derivationPath = account.derivationMode ?? "44'/60'/0'/0/0";

      const openAppConfig = await this.appDependencies
        .map((deps) => deps.find((dep) => dep.appName === "Ethereum"))
        .map((dep) =>
          dep
            ? Right(dep)
            : Left(new Error("Ethereum app dependencies not found")),
        )
        .chain(EitherAsync.liftEither)
        .map(({ appName, dependencies }) => ({
          application: { name: appName },
          dependencies: dependencies.map((name) => ({ name })),
          requireLatestFirmware: false,
        }))
        .run();

      const openResult = await lastValueFrom(
        dmk.executeDeviceAction({
          sessionId: sessionId,
          deviceAction: new OpenAppWithDependenciesDeviceAction({
            input: openAppConfig.unsafeCoerce(),
            inspect: false,
          }),
        }).observable,
      );

      if (openResult.status === "error") {
        this.logger.error("Error opening app", { error: openResult.error });
        throw new FailToOpenAppError("Failed to open app", {
          error: openResult.error,
        });
      }

      const { observable } = ethSigner.signTransaction(derivationPath, tx, {
        skipOpenApp: true,
      });
      const result = await lastValueFrom(observable);

      if (result.status === "error") {
        this.logger.error("Error signing transaction", { error: result.error });
        throw new SignTransactionError("Transaction signing failed", {
          error: result.error,
        });
      }

      if (result.status === "completed") {
        this.logger.debug("Transaction signing completed", {
          result: result.output,
        });
      }

      //TODO generate signed raw transaction using output for signing raw tx
      return {
        hash: keccak256(tx),
        rawTransaction,
      };
    } catch (error) {
      this.logger.error("Failed to sign transaction", { error });
      throw new SignTransactionError(`Transaction signing failed: ${error}`);
    }
  }
}
