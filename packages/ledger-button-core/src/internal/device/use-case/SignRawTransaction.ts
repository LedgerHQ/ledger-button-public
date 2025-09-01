import {
  hexaStringToBuffer,
  OpenAppWithDependenciesDeviceAction,
} from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { type Factory, inject, injectable } from "inversify";
import { lastValueFrom } from "rxjs";
import { keccak256 } from "viem";

import type { Account } from "../../account/service/AccountService.js";
import { originToken } from "../../config/config.js";
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
        originToken,
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
