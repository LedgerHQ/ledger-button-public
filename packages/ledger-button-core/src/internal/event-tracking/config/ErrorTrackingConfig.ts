export type TrackedErrorType =
  | "DeviceConnectionError"
  | "DeviceNotSupportedError"
  | "DeviceNotOnboardedError"
  | "DeviceDisconnectedError"
  | "SignTransactionError"
  | "FailToOpenAppError"
  | "UserRejectedTransactionError"
  | "IncorrectSeedError"
  | "AccountNotSelectedError"
  | "BlindSigningDisabledError"
  | "TransactionValidationError"
  | "LedgerSyncConnectionError"
  | "LedgerSyncAuthenticationError"
  | "LedgerKeyringProtocolError"
  | "LedgerSyncConnectionFailedError"
  | "LedgerSyncError"
  | "LedgerSyncAuthContextMissingError"
  | "LedgerSyncNoSessionIdError"
  | "DeviceOutOfMemoryError";

export const ERROR_TRACKING_WHITELIST: Set<TrackedErrorType> = new Set([
  "BlindSigningDisabledError",
  "DeviceConnectionError",
  "SignTransactionError",
  "DeviceNotSupportedError",
  "DeviceNotOnboardedError",
  "DeviceDisconnectedError",
  "UserRejectedTransactionError",
  "LedgerKeyringProtocolError",
  "IncorrectSeedError",
  "LedgerSyncAuthenticationError",
  "LedgerSyncConnectionFailedError",
  "FailToOpenAppError",
  "AccountNotSelectedError",
  "LedgerSyncError",
  "LedgerSyncAuthContextMissingError",
  "LedgerSyncNoSessionIdError",
  "TransactionValidationError",
  "LedgerSyncConnectionError",
  "DeviceOutOfMemoryError",
]);

export function shouldTrackError(errorType: string): boolean {
  return ERROR_TRACKING_WHITELIST.has(errorType as TrackedErrorType);
}

export interface ErrorTrackingConfig {
  enabled: boolean;
  useWhitelist: boolean;
  whitelist: Set<string>;
}

export const DEFAULT_ERROR_TRACKING_CONFIG: ErrorTrackingConfig = {
  enabled: true,
  useWhitelist: true,
  whitelist: ERROR_TRACKING_WHITELIST,
};
