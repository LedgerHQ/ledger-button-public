import { LedgerButtonError } from "./LedgerButtonError.js";

/**
 * Device-flow errors shared between core and the blockchain provider modules.
 *
 * They live on the public api surface so a provider package (EVM, Solana, ...)
 * can throw and map them without importing core internals.
 */
export type DeviceConnectionErrorType =
  | "no-accessible-device"
  | "failed-to-start-discovery"
  | "failed-to-connect"
  | "failed-to-disconnect"
  | "not-connected";

export class DeviceConnectionError extends LedgerButtonError<{
  type: DeviceConnectionErrorType;
  error?: unknown;
}> {
  constructor(
    message: string,
    context?: {
      type: DeviceConnectionErrorType;
      error?: unknown;
    },
  ) {
    super(message, "DeviceConnectionError", context);
  }
}

export class SignTransactionError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "SignTransactionError", context);
  }
}

export class AccountNotSelectedError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "AccountNotSelectedError", context);
  }
}

export class FailToOpenAppError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "FailToOpenAppError", context);
  }
}
