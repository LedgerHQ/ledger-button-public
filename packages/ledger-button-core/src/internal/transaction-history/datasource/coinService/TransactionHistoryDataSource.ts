import { Either } from "purify-ts";

import { TransactionHistoryError } from "@internal/transaction-history/model/TransactionHistoryError.js";
import {
  TransactionHistoryOptions,
  TransactionHistoryPage,
} from "@internal/transaction-history/model/transactionHistoryTypes.js";

export interface TransactionHistoryDataSource {
  getTransactions(
    address: string,
    currencyId: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, TransactionHistoryPage>>;
}
