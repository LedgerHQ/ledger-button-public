import { Either } from "purify-ts";

import { TransactionHistoryError } from "@internal/transaction-history/model/TransactionHistoryError";
import {
  TransactionHistoryOptions,
  TransactionHistoryPage,
} from "@internal/transaction-history/model/transactionHistoryTypes";

export interface TransactionHistoryDataSource {
  getTransactions(
    address: string,
    currencyId: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, TransactionHistoryPage>>;
}
