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
      tag: "ActionRefusedError",
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

  describe("with an error from another DMK instance", () => {
    it("maps a RefusedByUserDAError tag to UserRejectedTransactionError", () => {
      expect(
        mapOpenAppUserRejection({ _tag: "RefusedByUserDAError" }),
      ).toBeInstanceOf(UserRejectedTransactionError);
    });

    it.each(["GlobalCommandError", "ActionRefusedError"])(
      "maps a %s tag with the 5501 code to UserRejectedTransactionError",
      (_tag) => {
        expect(
          mapOpenAppUserRejection({ _tag, errorCode: "5501" }),
        ).toBeInstanceOf(UserRejectedTransactionError);
      },
    );

    it("keeps a global command error with another code unchanged", () => {
      const error = { _tag: "GlobalCommandError", errorCode: "6a80" };

      expect(mapOpenAppUserRejection(error)).toBe(error);
    });

    it("keeps a 5501 code without a global command error tag unchanged", () => {
      const error = { _tag: "SomeOtherError", errorCode: "5501" };

      expect(mapOpenAppUserRejection(error)).toBe(error);
    });
  });

  it.each([null, undefined, "5501"])("returns %s unchanged", (error) => {
    expect(mapOpenAppUserRejection(error)).toBe(error);
  });
});
