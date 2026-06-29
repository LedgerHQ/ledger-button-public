import { ethers, Signature } from "ethers";
import { inject, injectable } from "inversify";

import type { JsonRpcResponseSuccess } from "../../../../api/model/eip/EIPTypes.js";
import { SignedResults } from "../../../../api/model/signing/SignedTransaction.js";
import type { CoreFacade } from "../../../blockchain-provider/model/CoreFacade.js";
import { evmProviderModuleTypes } from "../../evmProviderModuleTypes.js";
import { createSignedTransaction } from "../transaction/TransactionHelper.js";
import { getCurrencyIdFromChainId } from "../utils/chainUtils.js";

export type BroadcastTransactionParams = {
  signature: Signature;
  rawTransaction: string;
};

function isJsonRpcResponseSuccess(
  value: unknown,
): value is JsonRpcResponseSuccess {
  return (
    typeof value === "object" &&
    value !== null &&
    "result" in value &&
    !("error" in value)
  );
}

@injectable()
export class BroadcastTransaction {
  constructor(
    @inject(evmProviderModuleTypes.CoreFacade)
    private readonly core: CoreFacade,
  ) {}

  async execute(params: BroadcastTransactionParams): Promise<SignedResults> {
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
