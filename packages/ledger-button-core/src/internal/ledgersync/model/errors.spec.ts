import { describe, expect, it } from "vitest";

import { LedgerButtonError } from "../../../api/errors/LedgerButtonError.js";
import {
  LedgerSyncAuthContextMissingError,
  LedgerSyncConnectionFailedError,
  LedgerSyncError,
  LedgerSyncNoSessionIdError,
} from "./errors.js";

describe.each([
  [LedgerSyncError, "LedgerSyncError", "Ledger sync failed"],
  [
    LedgerSyncAuthContextMissingError,
    "LedgerSyncAuthContextMissingError",
    "Auth context is missing",
  ],
  [
    LedgerSyncNoSessionIdError,
    "LedgerSyncNoSessionIdError",
    "No session ID available",
  ],
  [
    LedgerSyncConnectionFailedError,
    "LedgerSyncConnectionFailedError",
    "Connection failed",
  ],
])("%s", (ErrorClass, expectedName, message) => {
  it("should create error with message", () => {
    const error = new ErrorClass(message);

    expect(error).toBeInstanceOf(LedgerButtonError);
    expect(error.name).toBe(expectedName);
    expect(error.message).toBe(message);
    expect(error.context).toBeUndefined();
  });
});
