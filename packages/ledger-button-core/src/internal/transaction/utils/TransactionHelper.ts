import { ethers, Signature, TransactionLike } from "ethers";

import { Transaction } from "../../../api/index.js";
import { SignedTransaction } from "../../../api/model/signing/SignedTransaction.js";

export function createSignedTransaction(
  rawTransaction: string,
  signature: Signature,
): SignedTransaction {
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
    nonce: transaction["nonce"] ? parseInt(transaction["nonce"]) : undefined,
  };

  const etherTx = ethers.Transaction.from(sanitizedTransaction);
  const tx = etherTx.unsignedSerialized;
  return tx;
}
