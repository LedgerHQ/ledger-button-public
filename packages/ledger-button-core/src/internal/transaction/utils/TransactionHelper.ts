import { Signature as DeviceSignature } from "@ledgerhq/device-signer-kit-ethereum";
import { ethers, Signature, TransactionLike } from "ethers";

import type {
  BroadcastedTransactionResult,
  SignedTransactionResult,
} from "../../../api/model/signing/SignedTransaction.js";
import type { Transaction } from "../../../api/model/signing/SignTransactionParams.js";
import type { InvoicingEventData } from "../types.js";

export function createSignedTransaction(
  rawTransaction: string,
  signature: Signature,
): SignedTransactionResult | BroadcastedTransactionResult {
  //Generate Signed transaction
  const signedTx = ethers.Transaction.from(rawTransaction);
  signedTx.signature = signature;
  const signedRawTransaction = signedTx.serialized;
  console.log("Signed Raw Transaction", { signedRawTransaction });

  return {
    hash: signedTx.hash ?? undefined,
    rawTransaction: rawTransaction as unknown as Uint8Array<ArrayBufferLike>,
    signedRawTransaction: signedRawTransaction,
  };
}

export function getRawTransactionFromEipTransaction(transaction: Transaction) {
  //Sanitize the transaction for Ethers library to avoid errors
  const sanitizedTransaction: TransactionLike = {
    chainId: transaction["chainId"],
    to: transaction["to"],
    value: transaction["value"],
    data: transaction["data"],
    gasLimit: transaction["gas"],
    maxFeePerGas: transaction["maxFeePerGas"],
    maxPriorityFeePerGas: transaction["maxPriorityFeePerGas"],
    gasPrice: transaction["gasPrice"],
    nonce: transaction["nonce"]
      ? parseInt(transaction["nonce"], 16)
      : undefined,
  };

  const etherTx = ethers.Transaction.from(sanitizedTransaction);
  const tx = etherTx.unsignedSerialized;
  return tx;
}

export function getHexaStringFromSignature(signature: DeviceSignature) {
  return ethers.Signature.from(signature).serialized;
}

export function getInvoicingEventDataFromTransaction(
  rawTransaction: string,
): InvoicingEventData {
  const parsedTx = ethers.Transaction.from(rawTransaction);
  const isETHTransfer = parsedTx.value && parsedTx.value > 0n;

  return {
    transactionType: isETHTransfer ? "ETH_transfer" : "ERC-20_approve",
    sourceToken: isETHTransfer ? "ETH" : (parsedTx.to || "unknown"),
    targetToken: isETHTransfer ? "ETH" : (parsedTx.to || "unknown"),
    recipientAddress: parsedTx.to || "",
    transactionAmount: isETHTransfer ? ethers.formatEther(parsedTx.value) : "0",
  };
}
