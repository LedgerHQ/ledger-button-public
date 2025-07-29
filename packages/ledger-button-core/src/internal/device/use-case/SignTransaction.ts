import { hexaStringToBuffer } from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { type Factory, inject, injectable } from "inversify";
import { lastValueFrom } from "rxjs";
import { keccak256 } from "viem";

import { originToken, defaultDerivationPath } from "../../config/config.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import type { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";

export interface SignTransactionParams {
  rawTransaction: string;
  derivationPath?: string;
}

export interface SignedTransaction {
  hash: string;
  signature: {
    v: number;
    r: string;
    s: string;
  };
  rawTransaction: string;
}

@injectable()
export class SignTransaction {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
  ) {
    this.logger = loggerFactory("[SignTransaction]");
  }

  async execute(params: SignTransactionParams): Promise {
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

    const { rawTransaction, derivationPath = defaultDerivationPath } = params;

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

      const { observable } = ethSigner.signTransaction(derivationPath, tx);
      const result = await lastValueFrom(observable);

      this.logger.info("Transaction signing completed", { result });

      return {
        hash: keccak256(tx),
        signature: {
          v: result?.output.v,
          r: result?.output.r,
          s: result?.output.s,
        },
        rawTransaction: rawTx,
      };
    } catch (error) {
      this.logger.error("Failed to sign transaction", { error });
      throw new Error(`Transaction signing failed: ${error}`);
    }
  }
}
