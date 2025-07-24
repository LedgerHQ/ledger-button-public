import { type Factory, inject, injectable } from "inversify";
import { OpenAppCommand } from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { lastValueFrom } from "rxjs";
import {
  serializeTransaction,
  type TransactionSerializable,
  keccak256,
} from "viem";

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
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  type?: number | "legacy" | "eip2930" | "eip1559";
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
      const derivationPath = "44'/60'/0'/0/0"; // Ethereum derivation path

      this.logger.info("Opening Ethereum app on device");

      const openAppCommand = new OpenAppCommand({ appName: "Ethereum" });
      const openAppResult = await dmk.sendCommand({
        sessionId,
        command: openAppCommand,
      });

      this.logger.debug("Open app command executed", { openAppResult });

      const ethSigner = new SignerEthBuilder({
        dmk,
        sessionId,
      }).build();

      const viemTransaction: TransactionSerializable = {
        to: transactionData.to as `0x${string}`,
        value: BigInt(transactionData.value),
        data: (transactionData.data || "0x") as `0x${string}`,
        nonce: transactionData.nonce || 0,
        chainId: transactionData.chainId,
        type: (transactionData.type as any) || "eip1559",
      };

      if (
        transactionData.type === 2 ||
        transactionData.type === "eip1559" ||
        (!transactionData.type &&
          (transactionData.maxFeePerGas ||
            transactionData.maxPriorityFeePerGas))
      ) {
        // EIP-1559 transaction
        Object.assign(viemTransaction, {
          maxFeePerGas: BigInt(transactionData.maxFeePerGas || "30000000000"), // 30 gwei
          maxPriorityFeePerGas: BigInt(
            transactionData.maxPriorityFeePerGas || "2000000000",
          ), // 2 gwei
          gas: BigInt(transactionData.gasLimit || "21000"),
        });
      } else {
        // Legacy transaction
        Object.assign(viemTransaction, {
          gasPrice: BigInt(transactionData.gasPrice || "20000000000"), // 20 gwei
          gas: BigInt(transactionData.gasLimit || "21000"),
          type: "legacy" as const,
        });
      }

      this.logger.info("Starting transaction signing with device", {
        transactionData,
        derivationPath,
        viemTransaction: {
          to: viemTransaction.to,
          value: viemTransaction.value?.toString(),
          chainId: viemTransaction.chainId,
          type: viemTransaction.type,
        },
      });

      const serializedTransaction = serializeTransaction(viemTransaction);
      const transactionBytes = new Uint8Array(
        serializedTransaction
          .slice(2)
          .match(/.{2}/g)
          ?.map((byte) => parseInt(byte, 16)) || [],
      );

      const { observable } = ethSigner.signTransaction(
        derivationPath,
        transactionBytes,
      );

      const result = await lastValueFrom(observable);

      this.logger.info("Transaction signing completed", { result });

      if (result.status === "completed" && result.output) {
        const signedViemTransaction: TransactionSerializable = {
          ...viemTransaction,
          v: BigInt(result.output.v || 28),
          r: (result.output.r || "0x" + "0".repeat(64)) as `0x${string}`,
          s: (result.output.s || "0x" + "0".repeat(64)) as `0x${string}`,
        };

        const rawTransaction = serializeTransaction(signedViemTransaction);

        const transactionHash = keccak256(rawTransaction);

        const signedTransaction: SignedTransaction = {
          hash: transactionHash,
          signature: {
            v: result.output.v || 28,
            r: result.output.r || "0x" + "0".repeat(64),
            s: result.output.s || "0x" + "0".repeat(64),
          },
          rawTransaction,
        };

        this.logger.debug("Successfully signed transaction", {
          signedTransaction,
          viemHash: transactionHash,
          rawTx: rawTransaction,
        });
        return signedTransaction;
      } else {
        throw new Error(`Transaction signing failed: ${result.status}`);
      }
    } catch (error) {
      this.logger.error("Failed to sign transaction", { error });

      throw new Error(`Transaction signing failed: ${error}`);
    }
  }
}
