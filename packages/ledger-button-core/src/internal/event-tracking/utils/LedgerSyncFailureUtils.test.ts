import {
  LKRPDataSourceError,
  LKRPOutdatedTrustchainError,
  LKRPParsingError,
  LKRPTrustchainNotReady,
  LKRPUnauthorizedError,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { describe, expect, it } from "vitest";

import { LedgerSyncAuthenticationError } from "@api/model/errors";
import { LedgerSyncConnectionFailedError } from "@internal/ledgersync/model/errors";

import { toLedgerSyncFailureReason } from "./LedgerSyncFailureUtils";

const authenticationError = (cause: unknown) =>
  new LedgerSyncAuthenticationError("Ledger Sync failed", { cause });

describe("toLedgerSyncFailureReason", () => {
  it.each([
    ["the LKRP command (6985)", { _tag: "Error", errorCode: "6985" }],
    ["the open app command (5501)", { _tag: "Error", errorCode: "5501" }],
    ["a RefusedByUserDAError", { _tag: "RefusedByUserDAError" }],
  ])("maps a refusal on %s to user_rejected", (_, cause) => {
    expect(toLedgerSyncFailureReason(authenticationError(cause))).toBe(
      "user_rejected",
    );
  });

  it.each([
    [
      "app_not_installed",
      { _tag: "UnknownDeviceExchangeError", errorCode: "6807" },
    ],
    ["device_lock_timeout", { _tag: "DeviceLockedError" }],
    ["no_trustchain", new LKRPTrustchainNotReady()],
    ["unauthorized", new LKRPUnauthorizedError("trustchain-id")],
    ["unauthorized", new LKRPOutdatedTrustchainError()],
    [
      "network_error",
      new LKRPDataSourceError({ status: "UNKNOWN", message: "offline" }),
    ],
    ["unknown", new LKRPParsingError()],
  ])("maps the Ledger Sync error to %s", (failureReason, cause) => {
    expect(toLedgerSyncFailureReason(authenticationError(cause))).toBe(
      failureReason,
    );
  });

  it("maps a connection failure thrown by the SDK to network_error", () => {
    expect(
      toLedgerSyncFailureReason(new LedgerSyncConnectionFailedError("offline")),
    ).toBe("network_error");
  });

  it.each([
    [
      "an authentication error without cause",
      new LedgerSyncAuthenticationError("Unknown error"),
    ],
    ["a non-Error value", "boom"],
  ])("maps %s to unknown", (_, error) => {
    expect(toLedgerSyncFailureReason(error)).toBe("unknown");
  });
});
