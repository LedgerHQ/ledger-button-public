import { LedgerButtonError } from "./LedgerButtonError";

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

/**
 * Raised at the start of `initializeLedgerProvider` when no blockchain
 * factory was passed. The dApp call does not continue.
 */
export class NoBlockchainProviderError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "NoBlockchainProviderError", context);
  }
}
