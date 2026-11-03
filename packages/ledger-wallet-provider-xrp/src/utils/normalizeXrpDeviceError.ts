import {
  GlobalCommandError,
  RefusedByUserDAError,
} from "@ledgerhq/device-management-kit";
import {
  mapOpenAppDeviceActionError,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";

/** The XRP app answers `6985` when the user rejects the transaction. */
const APP_USER_REJECTION_CODE = "6985";
/** The device answers `5501` when the user refuses to open or install an app. */
const GLOBAL_USER_REJECTION_CODE = "5501";

/** Maps raw DMK and XRP app errors to the domain errors the UI can display. */
export function normalizeXrpDeviceError(
  error: unknown,
  appName: string,
): unknown {
  if (isUserRejection(error)) {
    return new UserRejectedTransactionError("User rejected the request");
  }
  return mapOpenAppDeviceActionError(error, appName);
}

function isUserRejection(error: unknown): boolean {
  if (error instanceof RefusedByUserDAError) {
    return true;
  }
  if (error instanceof GlobalCommandError) {
    return error.errorCode === GLOBAL_USER_REJECTION_CODE;
  }
  const errorCode = (error as { errorCode?: unknown } | null | undefined)
    ?.errorCode;
  return errorCode === APP_USER_REJECTION_CODE;
}
