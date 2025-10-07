import { GasFeeEstimation, TransactionInfo } from "../model/types.js";

export interface GasFeeEstimationService {
  getFeesForTransaction(tx: TransactionInfo): Promise<GasFeeEstimation>;
}
