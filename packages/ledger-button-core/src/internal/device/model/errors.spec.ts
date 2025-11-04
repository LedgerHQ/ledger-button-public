import { describe, expect, it } from "vitest";

import {
  AccountNotSelectedError,
  DeviceConnectionError,
  FailToOpenAppError,
  SignTransactionError,
} from "./errors.js";

describe("Device Error Classes", () => {
  describe("DeviceConnectionError", () => {
    it("should handle all DeviceConnectionErrorType values", () => {
      const types = [
        "no-accessible-device",
        "failed-to-start-discovery",
        "failed-to-connect",
        "failed-to-disconnect",
        "not-connected",
      ] as const;

      types.forEach((type) => {
        const error = new DeviceConnectionError("Error msg: " + type, { type });
        expect(error).toBeInstanceOf(DeviceConnectionError);
        expect(error.context?.type).toBe(type);
        expect(error.message).toBe("Error msg: " + type);
      });
    });
  });

  describe("SignTransactionError", () => {
    it("should create error", () => {
      const context = { transactionId: "tx-123", reason: "User rejected" };
      const error = new SignTransactionError("Transaction rejected", context);
      expect(error).toBeInstanceOf(SignTransactionError);
      expect(error.message).toBe("Transaction rejected");
      expect(error.context).toEqual(context);
    });
  });

  describe("AccountNotSelectedError", () => {
    it("should create error", () => {
      const context = { requiredAction: "select-account" };
      const error = new AccountNotSelectedError(
        "Please select an account",
        context,
      );

      expect(error).toBeInstanceOf(AccountNotSelectedError);
      expect(error.message).toBe("Please select an account");
      expect(error.context).toEqual(context);
    });
  });

  describe("FailToOpenAppError", () => {
    it("should create error with message", () => {
      const error = new FailToOpenAppError("Failed to open app");

      expect(error.message).toBe("Failed to open app");
      expect(error.name).toBe("FailToOpenAppError");
    });

    it("should create error with context", () => {
      const context = { appName: "Ethereum", deviceId: "device-123" };
      const error = new FailToOpenAppError("App not found", context);

      expect(error).toBeInstanceOf(FailToOpenAppError);
      expect(error.message).toBe("App not found");
      expect(error.context).toEqual(context);
    });
  });
});
