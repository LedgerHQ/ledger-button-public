import { LedgerButtonError } from "./LedgerButtonError.js";

/**
 * Raised when the user closes the in-flow modal before a provider phase
 * (account selection / signing) settles. Lives on the public api surface so
 * blockchain provider modules can map it without reaching into internals.
 */
export class ModalClosedError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "ModalClosedError", context);
  }
}
