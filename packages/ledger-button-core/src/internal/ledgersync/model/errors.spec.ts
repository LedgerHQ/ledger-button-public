import { describe, expect, it } from "vitest";

import {
  LedgerSyncAuthContextMissingError,
  LedgerSyncConnectionFailedError,
  LedgerSyncError,
  LedgerSyncNoSessionIdError,
} from "./errors.js";

describe("LedgerSync Errors", () => {
  it.each([
    {
      ErrorClass: LedgerSyncError,
      errorName: "LedgerSyncError",
      message: "Simple error",
      context: undefined,
    },
    {
      ErrorClass: LedgerSyncError,
      errorName: "LedgerSyncError",
      message: "Error with context",
      context: { userId: "123", action: "sync" },
    },
    {
      ErrorClass: LedgerSyncError,
      errorName: "LedgerSyncError",
      message: "Complex error",
      context: { nested: { deep: { value: 123 } } },
    },
    {
      ErrorClass: LedgerSyncAuthContextMissingError,
      errorName: "LedgerSyncAuthContextMissingError",
      message: "Auth context is missing",
      context: undefined,
    },
    {
      ErrorClass: LedgerSyncAuthContextMissingError,
      errorName: "LedgerSyncAuthContextMissingError",
      message: "No encryption key",
      context: { attemptedAction: "decrypt", timestamp: 1234567890 },
    },
    {
      ErrorClass: LedgerSyncAuthContextMissingError,
      errorName: "LedgerSyncAuthContextMissingError",
      message: "Missing JWT token",
      context: { operation: "authenticate" },
    },
    {
      ErrorClass: LedgerSyncNoSessionIdError,
      errorName: "LedgerSyncNoSessionIdError",
      message: "No session ID available",
      context: undefined,
    },
    {
      ErrorClass: LedgerSyncNoSessionIdError,
      errorName: "LedgerSyncNoSessionIdError",
      message: "Session ID not found",
      context: { deviceConnected: false, attemptedAt: "2025-10-20" },
    },
    {
      ErrorClass: LedgerSyncNoSessionIdError,
      errorName: "LedgerSyncNoSessionIdError",
      message: "Session expired",
      context: { lastSessionId: "abc123", expired: true },
    },
    {
      ErrorClass: LedgerSyncConnectionFailedError,
      errorName: "LedgerSyncConnectionFailedError",
      message: "Connection failed",
      context: undefined,
    },
    {
      ErrorClass: LedgerSyncConnectionFailedError,
      errorName: "LedgerSyncConnectionFailedError",
      message: "Network error",
      context: { errorCode: 500, retries: 3, url: "https://api.ledger.com" },
    },
    {
      ErrorClass: LedgerSyncConnectionFailedError,
      errorName: "LedgerSyncConnectionFailedError",
      message: "Network timeout",
      context: { timeout: 30000, url: "https://api.ledger.com" },
    },
  ])(
    "should create $errorName with message: '$message'",
    ({ ErrorClass, errorName, message, context }) => {
      const error = new ErrorClass(message, context);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ErrorClass);
      expect(error.message).toBe(message);
      expect(error.name).toBe(errorName);
    },
  );
});
