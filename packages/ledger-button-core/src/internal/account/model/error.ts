import { LedgerButtonError } from "../../../api/errors/LedgerButtonError.js";

export class FetchAccountsError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "FetchAccountsError", context);
  }
}

export type AccountServiceError = FetchAccountsError;
