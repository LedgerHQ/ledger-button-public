import { LedgerButtonError } from "@api/errors/LedgerButtonError";

export type TransactionHistoryErrorContext = {
  address?: string;
  currencyId?: string;
  originalError?: string;
};

export class TransactionHistoryError extends LedgerButtonError<TransactionHistoryErrorContext> {
  constructor(message: string, context?: TransactionHistoryErrorContext) {
    super(message, "TransactionHistoryError", context);
  }
}
