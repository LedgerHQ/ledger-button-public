import {
  Signature,
  SignerEthBuilder,
  type TypedData,
} from "@ledgerhq/device-signer-kit-ethereum";
import { type Factory, inject, injectable } from "inversify";
import { lastValueFrom } from "rxjs";

import { accountModuleTypes } from "../../account/accountModuleTypes.js";
import type { AccountService } from "../../account/service/AccountService.js";
import { configModuleTypes } from "../../config/configModuleTypes.js";
import { Config } from "../../config/model/config.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import type { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";

export interface SignTypedDataParams {
  typedData: TypedData;
}

@injectable()
export class SignTypedData {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(accountModuleTypes.AccountService)
    private readonly accountService: AccountService,
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {
    this.logger = loggerFactory("[SignTypedData]");
  }

  // TODO: fix the return type here
  async execute(params: SignTypedDataParams): Promise<Signature> {
    this.logger.info("Starting typed data signing", { params });

    const sessionId = this.deviceManagementKitService.sessionId;
    if (!sessionId) {
      this.logger.error("No device connected");
      throw new Error("No device connected. Please connect a device first.");
    }

    const device = this.deviceManagementKitService.connectedDevice;
    if (!device) {
      this.logger.error("No connected device found");
      throw new Error("No connected device found");
    }

    const { typedData } = params;

    try {
      const dmk = this.deviceManagementKitService.dmk;
      const ethSigner = new SignerEthBuilder({
        dmk,
        originToken: this.config.originToken,
        sessionId,
      }).build();

      const account = this.accountService.getSelectedAccount();
      if (!account) {
        throw Error("No account selected");
      }

      const derivationPath = account.derivationMode;

      const { observable } = ethSigner.signTypedData(derivationPath, typedData);
      const result = await lastValueFrom(observable);

      if (result.status === "error" || result.status !== "completed") {
        throw Error("Typed data signing failed");
      }

      return result.output;
    } catch (error) {
      this.logger.error("Failed to sign typed data", { error });
      throw new Error(`Typed data signing failed: ${error}`);
    }
  }
}
