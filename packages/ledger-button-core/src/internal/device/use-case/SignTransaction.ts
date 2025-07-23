import { type Factory, inject, injectable } from "inversify";
import { OpenAppCommand } from "@ledgerhq/device-management-kit";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";

export interface TransactionData {
  to: string;
  value: string;
  data?: string;
  chainId: number;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface SignedTransaction {
  hash: string;
  signature: string;
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

  async execute(transactionData: TransactionData): Promise {
    this.logger.info("Starting transaction signing", { transactionData });

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

    try {
      const dmk = this.deviceManagementKitService.dmk;
      const appName = "Ethereum";
      const derivationPathMapper = {
        Ethereum: "44'/60'/0'/0/0",
      };
      const derivationPath = derivationPathMapper[appName];

      const openAppCommand = new OpenAppCommand({ appName });
      const openAppResult = await dmk.sendCommand({
        sessionId,
        command: openAppCommand,
      });

      const transactionToSign = {
        nonce: transactionData.nonce,
        gasPrice: transactionData.gasPrice,
        gasLimit: transactionData.gasLimit,
        to: transactionData.to,
        value: transactionData.value,
        data: transactionData.data,
        chainId: transactionData.chainId,
      };

      // TODO: Implement transactin signing

      return {
        hash: "",
        signature: "",
        rawTransaction: "",
      };
    } catch (error) {
      this.logger.error("Failed to sign transaction", { error });

      throw new Error(`Transaction signing failed: ${error}`);
    }
  }
}
