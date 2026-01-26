import { Either } from "purify-ts";

import {
  ExplorerResponse,
  TransactionHistoryOptions,
} from "../model/transactionHistoryTypes.js";

export interface TransactionHistoryDataSource {
  getTransactions(
    blockchain: string,
    address: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<Error, ExplorerResponse>>;
}
