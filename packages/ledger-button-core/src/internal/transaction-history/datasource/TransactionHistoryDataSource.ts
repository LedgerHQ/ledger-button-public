import { Either } from "purify-ts";

import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import {
  AlpacaOperationsResponse,
  TransactionHistoryOptions,
} from "../model/transactionHistoryTypes.js";

export interface TransactionHistoryDataSource {
  getTransactions(
    network: string,
    address: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, AlpacaOperationsResponse>>;
}
