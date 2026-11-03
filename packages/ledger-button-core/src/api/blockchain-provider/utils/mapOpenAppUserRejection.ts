import { UserRejectedTransactionError } from "@api/errors/DeviceErrors";

/** The device answers `5501` when the user refuses to open or install an app. */
const GLOBAL_USER_REJECTION_CODE = "5501";

const REFUSED_BY_USER_TAG = "RefusedByUserDAError";

/**
 * Tags carried by a DMK global command error: `GlobalCommandError` by default,
 * `ActionRefusedError` once the device status word `5501` has been resolved.
 */
const GLOBAL_COMMAND_ERROR_TAGS = new Set([
  "GlobalCommandError",
  "ActionRefusedError",
]);

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

/**
 * Matched on `_tag` and `errorCode` rather than with `instanceof` because a
 * duplicated DMK instance in the dependency tree would break prototype
 * identity.
 */
function isUserRefusal(error: unknown): boolean {
  const { _tag: tag, errorCode } = (error ?? {}) as {
    _tag?: unknown;
    errorCode?: unknown;
  };
  if (tag === REFUSED_BY_USER_TAG) {
    return true;
  }
  return (
    typeof tag === "string" &&
    GLOBAL_COMMAND_ERROR_TAGS.has(tag) &&
    errorCode === GLOBAL_USER_REJECTION_CODE
  );
}
