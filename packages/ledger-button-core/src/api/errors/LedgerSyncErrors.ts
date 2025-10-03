import { LedgerButtonError } from "./LedgerButtonError.js";

export class NoCompatibleAccountsError extends LedgerButtonError<{
  networks: string[];
}> {
  constructor(
    message: string,
    context: { networks: string[] } = { networks: [] },
  ) {
    super(message, "NoCompatibleAccountsError", context);
  }
}

export class NoAccountInSyncError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "NoAccountInSyncError", context);
  }
}

export class FailedToFetchEncryptedAccountsError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "FailedToFetchEncryptedAccountsError", context);
  }
}
