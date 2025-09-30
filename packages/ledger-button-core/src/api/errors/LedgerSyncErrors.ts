import { LedgerButtonError } from "./LedgerButtonError.js";

export class NoCompatibleAccountsError extends LedgerButtonError<{
  networks: string[];
}> {
  constructor(message: string, context?: { networks: string[] }) {
    super(message, "NoCompatibleAccountsError", context);
  }
}
