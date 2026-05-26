import { DeviceModelId } from "@ledgerhq/device-management-kit";

import { LedgerButtonError } from "./LedgerButtonError.js";

export class DeviceNotSupportedError extends LedgerButtonError<{
  modelId: DeviceModelId;
}> {
  constructor(message: string, context: { modelId: DeviceModelId }) {
    super(message, "DeviceNotSupportedError", context);
  }
}

export class DeviceNotOnboardedError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "DeviceNotOnboardedError", context);
  }
}

export class DeviceDisconnectedError extends LedgerButtonError<{
  deviceModel?: string;
  connectionType?: "bluetooth" | "usb";
}> {
  constructor(
    message: string,
    context?: { deviceModel?: string; connectionType?: "bluetooth" | "usb" },
  ) {
    super(message, "DeviceDisconnectedError", context);
  }
}

export class IncorrectSeedError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "IncorrectSeedError", context);
  }
}

export class BlindSigningDisabledError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "BlindSigningDisabledError", context);
  }
}

export class UserRejectedTransactionError extends LedgerButtonError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "UserRejectedTransactionError", context);
  }
}

export class DeviceOutOfMemoryError extends LedgerButtonError<{
  appName?: string;
}> {
  constructor(message: string, context?: { appName?: string }) {
    super(message, "DeviceOutOfMemoryError", context);
  }
}
