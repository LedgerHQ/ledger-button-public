import { GasFeeEstimation, TransactionInfo } from "../../../balance/model/types.js";

export interface GasFeeEstimationService {
  getFeesForTransaction(tx: TransactionInfo): Promise<GasFeeEstimation>;
  getNonceForTx(tx: TransactionInfo): Promise<string>;
}
