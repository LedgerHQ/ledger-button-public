import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import {
  isCoinServiceBroadcastResponse,
  isJsonRpcResponseSuccess,
} from "@ledgerhq/ledger-wallet-provider-core";
import { ethers, Signature } from "ethers";
import { inject, injectable } from "inversify";

import { evmProviderModuleTypes } from "../di/evmProviderModuleTypes.js";
import type { EvmSignedResult } from "../model/EvmSignedResult.js";
import { createSignedTransaction } from "../transaction/TransactionHelper.js";
import { getCurrencyIdFromChainId } from "../utils/chainUtils.js";

export type BroadcastTransactionParams = {
  signature: Signature;
  rawTransaction: string;
};

@injectable()
export class BroadcastTransaction {
  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
  ) {}

  async execute(params: BroadcastTransactionParams): Promise<EvmSignedResult> {
    const logger = this.core.getLogger("BroadcastTransaction");
    logger.debug("Transaction to be signed with signature", { params });

    const signedTransaction = createSignedTransaction(
      params.rawTransaction,
      params.signature,
    );

    const txChainId = Number(
      ethers.Transaction.from(params.rawTransaction).chainId,
    );
    const currencyId = getCurrencyIdFromChainId(txChainId);
    if (!currencyId) {
      logger.error("Unsupported chain ID for tx, cannot broadcast", {
        txChainId,
      });
      throw new Error(
        "Unsupported chain id for tx, cannot broadcast transaction",
      );
    }

    const response = await this.core.broadcastRPC(
      {
        method: "eth_sendRawTransaction",
        params: [signedTransaction.signedRawTransaction],
        id: 1,
        jsonrpc: "2.0",
      },
      { name: "ethereum", chainId: txChainId.toString() },
    );

    if (isCoinServiceBroadcastResponse(response)) {
      return {
        hash: response.transactionIdentifier,
        rawTransaction:
          params.rawTransaction as unknown as Uint8Array<ArrayBufferLike>,
        signedRawTransaction: signedTransaction.signedRawTransaction,
      };
    } else {
      if (!isJsonRpcResponseSuccess(response)) {
        logger.error("Failed to broadcast transaction", { response });
        throw new Error("Failed to broadcast transaction");
      }

      return {
        hash: response.result as string,
        rawTransaction:
          params.rawTransaction as unknown as Uint8Array<ArrayBufferLike>,
        signedRawTransaction: signedTransaction.signedRawTransaction,
      };
    }
  }
}
