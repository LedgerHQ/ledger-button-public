import { LedgerButtonError } from "../../../api/errors/LedgerButtonError.js";

export class DeviceConnectionError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "DeviceConnectionError", context);
  }
}

export type DeviceServiceError = DeviceConnectionError;
