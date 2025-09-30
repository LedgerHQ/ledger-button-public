import { LedgerButtonError } from "./LedgerButtonError.js";

export class BroadcastTransactionError extends LedgerButtonError<{
  error: Error;
}> {
  constructor(message: string, context: { error: Error }) {
    super(message, "BroadcastTransactionError", context);
  }
}
