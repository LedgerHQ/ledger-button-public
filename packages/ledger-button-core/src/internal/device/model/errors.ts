import { LedgerButtonError } from "../../../api/errors/LedgerButtonError.js";

export class DeviceConnectionError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
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

export type DeviceServiceErrors =
  | DeviceConnectionError
  | SignTransactionError
  | AccountNotSelectedError;
