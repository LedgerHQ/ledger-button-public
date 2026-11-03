import {
  GlobalCommandError,
  RefusedByUserDAError,
} from "@ledgerhq/device-management-kit";

import { UserRejectedTransactionError } from "@api/errors/DeviceErrors";

/** The device answers `5501` when the user refuses to open or install an app. */
const GLOBAL_USER_REJECTION_CODE = "5501";

/**
 * Maps a user refusal during the open-app step (DMK `RefusedByUserDAError` or
 * the device `5501` status) to `UserRejectedTransactionError`. Other errors
 * are returned unchanged.
 */
export function mapOpenAppUserRejection(error: unknown): unknown {
  if (isUserRefusal(error)) {
    return new UserRejectedTransactionError("User rejected open app");
  }
  return error;
}

function isUserRefusal(error: unknown): boolean {
  if (error instanceof RefusedByUserDAError) {
    return true;
  }
  return (
    error instanceof GlobalCommandError &&
    error.errorCode === GLOBAL_USER_REJECTION_CODE
  );
}
