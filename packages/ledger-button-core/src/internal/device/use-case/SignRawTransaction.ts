import {
  hexaStringToBuffer,
  OpenAppWithDependenciesDAInput,
  OpenAppWithDependenciesDeviceAction,
} from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { type Factory, inject, injectable } from "inversify";
import { lastValueFrom } from "rxjs";
import { keccak256 } from "viem";

import { accountModuleTypes } from "../../account/accountModuleTypes.js";
import type {
  Account,
  AccountService,
} from "../../account/service/AccountService.js";
import { originToken } from "../../config/config.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import type { StorageService } from "../../storage/StorageService.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
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

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
  ) {
    this.logger = loggerFactory("[SignRawTransaction]");
  }

  async execute(params: SignRawTransactionParams): Promise<SignedTransaction> {
    this.logger.info("Starting transaction signing", { params });

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

    console.log("params", params);
    const { rawTransaction } = params;

    try {
      const dmk = this.deviceManagementKitService.dmk;
      const ethSigner = new SignerEthBuilder({
        dmk,
        originToken,
        sessionId,
      }).build();

      const tx = hexaStringToBuffer(rawTransaction);
      if (!tx) {
        throw Error("Invalid raw transaction format");
      }

      const account: Account | undefined = this.storageService
        .getSelectedAccount()
        ?.extract();
      if (!account) {
        throw Error("No account selected");
      }

      const derivationPath = "44'/60'/0'/0/0"; //TODO use account.derivationMode when we will not use mocked account in LKRP

      //TODO use config for launching and installing the app
      const openResult = await lastValueFrom(
        dmk.executeDeviceAction({
          sessionId: sessionId,
          deviceAction: new OpenAppWithDependenciesDeviceAction({
            input: {
              application: {
                name: "Ethereum",
              },
              dependencies: [],
              requireLatestFirmware: false,
            },
            inspect: false,
          }),
        }).observable,
      );

      if (openResult.status === "error") {
        console.log("Error opening app", openResult.error);
        throw Error("Failed to open app");
      }

      const { observable } = ethSigner.signTransaction(derivationPath, tx, {
        skipOpenApp: true,
      });
      const result = await lastValueFrom(observable);

      if (result.status === "error") {
        console.log("Error signing transaction", result.error);
        throw Error("Transaction signing failed");
      }

      if (result.status === "completed") {
        this.logger.info("Transaction signing completed", {
          result: result.output,
        });
      }

      //TODO generate signed raw transaction using output
      return {
        hash: keccak256(tx),
        rawTransaction,
      };
    } catch (error) {
      this.logger.error("Failed to sign transaction", { error });
      throw new Error(`Transaction signing failed: ${error}`);
    }
  }
}
