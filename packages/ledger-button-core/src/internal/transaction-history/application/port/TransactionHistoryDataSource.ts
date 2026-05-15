import { Either } from "purify-ts";

import { TransactionHistoryError } from "../../domain/TransactionHistoryError.js";
import {
  TransactionHistoryOptions,
  TransactionHistoryPage,
} from "../../domain/transactionHistoryTypes.js";

export interface TransactionHistoryDataSource {
  getTransactions(
    address: string,
    currencyId: string,
    options?: TransactionHistoryOptions,
  ): Promise<Either<TransactionHistoryError, TransactionHistoryPage>>;
}
