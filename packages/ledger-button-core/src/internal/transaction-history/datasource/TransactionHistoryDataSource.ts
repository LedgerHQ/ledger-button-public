import { Either } from "purify-ts";

import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import {
  TransactionHistoryOptions,
  TransactionHistoryPage,
} from "../model/transactionHistoryTypes.js";

export interface TransactionHistoryDataSource {
  getTransactions(
    address: string,
    currencyId: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, TransactionHistoryPage>>;
}
