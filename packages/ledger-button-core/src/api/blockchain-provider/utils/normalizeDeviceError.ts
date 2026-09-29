import { DeviceDisconnectedError } from "@api/errors/DeviceErrors";
import type { SignFlowStatus } from "@api/model/signing/SignFlowStatus";

/**
 * DMK reports a mid-flow unplug through several distinct error tags. They are
 * matched on `_tag` rather than with `instanceof` because a duplicated DMK
 * instance in the dependency tree would break prototype identity.
 */
const DMK_DISCONNECTION_TAGS = new Set([
  "DeviceDisconnectedWhileSendingError",
  "DeviceDisconnectedBeforeSendingApdu",
  "ReconnectionFailedError",
]);

/**
 * Translates a raw DMK disconnection error into a {@link DeviceDisconnectedError}
 * so the UI can show reconnection guidance instead of a generic failure. Any
 * other error is returned untouched.
 */
export function normalizeDeviceError(error: unknown): unknown {
  if (error instanceof DeviceDisconnectedError) {
    return error;
  }

  const tag = (error as { _tag?: unknown } | null | undefined)?._tag;

  if (typeof tag === "string" && DMK_DISCONNECTION_TAGS.has(tag)) {
    return new DeviceDisconnectedError("Device disconnected during signing");
  }

  return error;
}

/**
 * Applies {@link normalizeDeviceError} to an error status, returning the very
 * same status object when nothing needed translating so subscribers can still
 * compare emissions by identity.
 */
export function normalizeSignFlowStatusError(
  status: SignFlowStatus,
): SignFlowStatus {
  if (status.status !== "error") {
    return status;
  }

  const error = normalizeDeviceError(status.error);

  return error === status.error ? status : { ...status, error };
}
