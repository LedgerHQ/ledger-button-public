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

import { toLedgerSyncFailure } from "./LedgerSyncFailureUtils";

const authenticationError = (cause: unknown) =>
  new LedgerSyncAuthenticationError("Ledger Sync failed", { cause });

describe("toLedgerSyncFailure", () => {
  it.each([
    ["the LKRP command (6985)", { _tag: "Error", errorCode: "6985" }],
    ["the open app command (5501)", { _tag: "Error", errorCode: "5501" }],
    ["a RefusedByUserDAError", { _tag: "RefusedByUserDAError" }],
  ])("maps a refusal on %s to user_rejected", (_, cause) => {
    expect(toLedgerSyncFailure(authenticationError(cause))).toEqual({
      failureReason: "user_rejected",
    });
  });

  it("maps an unknown application to app_not_installed", () => {
    expect(
      toLedgerSyncFailure(
        authenticationError({
          _tag: "UnknownDeviceExchangeError",
          errorCode: "6807",
        }),
      ),
    ).toEqual({
      failureReason: "app_not_installed",
      errorType: "UnknownDeviceExchangeError:6807",
    });
  });

  it("maps a locked device to device_locked", () => {
    expect(
      toLedgerSyncFailure(authenticationError({ _tag: "DeviceLockedError" })),
    ).toEqual({
      failureReason: "device_locked",
      errorType: "DeviceLockedError",
    });
  });

  it.each([
    ["no_trustchain", new LKRPTrustchainNotReady()],
    ["unauthorized", new LKRPUnauthorizedError("trustchain-id")],
    ["unauthorized", new LKRPOutdatedTrustchainError()],
    [
      "network_error",
      new LKRPDataSourceError({ status: "UNKNOWN", message: "offline" }),
    ],
    ["unknown", new LKRPParsingError()],
  ])("maps the Ledger Sync error to %s", (failureReason, cause) => {
    expect(toLedgerSyncFailure(authenticationError(cause))).toMatchObject({
      failureReason,
      errorType: "LedgerKeyringProtocolError",
    });
  });

  it("maps a connection failure thrown by the SDK to network_error", () => {
    expect(
      toLedgerSyncFailure(new LedgerSyncConnectionFailedError("offline")),
    ).toEqual({
      failureReason: "network_error",
      errorType: "LedgerSyncConnectionFailedError",
    });
  });

  it("maps an authentication error without cause to unknown", () => {
    expect(
      toLedgerSyncFailure(new LedgerSyncAuthenticationError("Unknown error")),
    ).toEqual({
      failureReason: "unknown",
      errorType: "LedgerSyncAuthenticationError",
    });
  });

  it("maps a non-Error value to unknown, without error type", () => {
    expect(toLedgerSyncFailure("boom")).toEqual({ failureReason: "unknown" });
  });
});
