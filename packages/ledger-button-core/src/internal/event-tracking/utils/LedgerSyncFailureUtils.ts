import {
  LKRPDataSourceError,
  LKRPOutdatedTrustchainError,
  LKRPTrustchainNotReady,
  LKRPUnauthorizedError,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";

import { LedgerSyncAuthenticationError } from "@api/model/errors";
import type { LedgerSyncFailureReason } from "@internal/backend/model/trackEvent";
import { LedgerSyncConnectionFailedError } from "@internal/ledgersync/model/errors";

export type LedgerSyncFailure = {
  failureReason: LedgerSyncFailureReason;
  errorType?: string;
};

const USER_REJECTED_CODES = new Set(["6985", "5501"]);
const APP_NOT_INSTALLED_CODE = "6807";
const DEVICE_LOCKED_CODE = "5515";

export function toLedgerSyncFailure(error: unknown): LedgerSyncFailure {
  const cause = unwrapAuthenticationError(error);
  const failureReason = toFailureReason(cause);

  if (failureReason === "user_rejected") {
    return { failureReason };
  }

  return { failureReason, errorType: toErrorType(cause) };
}

function unwrapAuthenticationError(error: unknown): unknown {
  if (error instanceof LedgerSyncAuthenticationError && error.context?.cause) {
    return error.context.cause;
  }

  return error;
}

function toFailureReason(error: unknown): LedgerSyncFailureReason {
  if (error instanceof LKRPTrustchainNotReady) {
    return "no_trustchain";
  }

  if (
    error instanceof LKRPUnauthorizedError ||
    error instanceof LKRPOutdatedTrustchainError
  ) {
    return "unauthorized";
  }

  if (
    error instanceof LKRPDataSourceError ||
    error instanceof LedgerSyncConnectionFailedError
  ) {
    return "network_error";
  }

  const { tag, errorCode } = readDeviceError(error);

  if (
    tag === "RefusedByUserDAError" ||
    (errorCode && USER_REJECTED_CODES.has(errorCode))
  ) {
    return "user_rejected";
  }

  if (errorCode === APP_NOT_INSTALLED_CODE) {
    return "app_not_installed";
  }

  if (tag === "DeviceLockedError" || errorCode === DEVICE_LOCKED_CODE) {
    return "device_locked";
  }

  return "unknown";
}

function toErrorType(error: unknown): string | undefined {
  const { tag, errorCode } = readDeviceError(error);
  const name = tag ?? (error instanceof Error ? error.name : undefined);

  if (!name) {
    return undefined;
  }

  return errorCode ? `${name}:${errorCode}` : name;
}

function readDeviceError(error: unknown): {
  tag?: string;
  errorCode?: string;
} {
  if (typeof error !== "object" || error === null) {
    return {};
  }

  const { _tag, errorCode } = error as { _tag?: unknown; errorCode?: unknown };

  return {
    tag: typeof _tag === "string" ? _tag : undefined,
    errorCode: typeof errorCode === "string" ? errorCode : undefined,
  };
}
