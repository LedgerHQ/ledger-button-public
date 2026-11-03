import {
  GlobalCommandError,
  RefusedByUserDAError,
  UnknownDAError,
} from "@ledgerhq/device-management-kit";
import { describe, expect, it } from "vitest";

import { UserRejectedTransactionError } from "@api/errors/DeviceErrors";

import { mapOpenAppUserRejection } from "./mapOpenAppUserRejection";

describe("mapOpenAppUserRejection", () => {
  it("maps RefusedByUserDAError to UserRejectedTransactionError", () => {
    expect(
      mapOpenAppUserRejection(new RefusedByUserDAError("refused")),
    ).toBeInstanceOf(UserRejectedTransactionError);
  });

  it("maps GlobalCommandError 5501 to UserRejectedTransactionError", () => {
    const error = new GlobalCommandError({
      errorCode: "5501",
      message: "refused",
      tag: "refused-by-user",
    } as never);

    expect(mapOpenAppUserRejection(error)).toBeInstanceOf(
      UserRejectedTransactionError,
    );
  });

  it("keeps other GlobalCommandError codes unchanged", () => {
    const error = new GlobalCommandError({
      errorCode: "6a80",
      message: "other",
      tag: "other",
    } as never);

    expect(mapOpenAppUserRejection(error)).toBe(error);
  });

  it("returns unrelated errors unchanged", () => {
    const error = new UnknownDAError("boom");

    expect(mapOpenAppUserRejection(error)).toBe(error);
  });
});
