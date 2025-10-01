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
