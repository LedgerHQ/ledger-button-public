import { describe, expect, it } from "vitest";

import {
  AccountNotSelectedError,
  DeviceConnectionError,
  FailToOpenAppError,
  SignTransactionError,
} from "./errors.js";

describe("Device Error Classes", () => {
  describe("DeviceConnectionError", () => {
    it("should create error with message and type", () => {
      const error = new DeviceConnectionError("No device found", {
        type: "no-accessible-device",
      });

      expect(error.message).toBe("No device found");
      expect(error.name).toBe("DeviceConnectionError");
      expect(error.context?.type).toBe("no-accessible-device");
    });

    it("should create error with nested error", () => {
      const originalError = new Error("Original error");
      const error = new DeviceConnectionError("Failed to connect", {
        type: "failed-to-connect",
        error: originalError,
      });

      expect(error.message).toBe("Failed to connect");
      expect(error.context?.type).toBe("failed-to-connect");
      expect(error.context?.error).toBe(originalError);
    });

    it("should handle all DeviceConnectionErrorType values", () => {
      const types = [
        "no-accessible-device",
        "failed-to-start-discovery",
        "failed-to-connect",
        "failed-to-disconnect",
        "not-connected",
      ] as const;

      types.forEach((type) => {
        const error = new DeviceConnectionError("Test error", { type });
        expect(error.context?.type).toBe(type);
      });
    });

    it("should create error without context", () => {
      const error = new DeviceConnectionError("Simple error");

      expect(error.message).toBe("Simple error");
      expect(error.name).toBe("DeviceConnectionError");
    });

    it("should be instanceof Error and DeviceConnectionError", () => {
      const error = new DeviceConnectionError("Test", {
        type: "failed-to-connect",
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DeviceConnectionError);
    });
  });

  describe("SignTransactionError", () => {
    it("should create error with message", () => {
      const error = new SignTransactionError("Failed to sign transaction");

      expect(error.message).toBe("Failed to sign transaction");
      expect(error.name).toBe("SignTransactionError");
    });

    it("should create error with context", () => {
      const context = { transactionId: "tx-123", reason: "User rejected" };
      const error = new SignTransactionError(
        "Transaction rejected",
        context,
      );

      expect(error.message).toBe("Transaction rejected");
      expect(error.context).toEqual(context);
    });

    it("should create error without context", () => {
      const error = new SignTransactionError("Simple sign error");

      expect(error.message).toBe("Simple sign error");
      expect(error.name).toBe("SignTransactionError");
    });

    it("should be instanceof Error and SignTransactionError", () => {
      const error = new SignTransactionError("Test");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SignTransactionError);
    });
  });

  describe("AccountNotSelectedError", () => {
    it("should create error with message", () => {
      const error = new AccountNotSelectedError("No account selected");

      expect(error.message).toBe("No account selected");
      expect(error.name).toBe("AccountNotSelectedError");
    });

    it("should create error with context", () => {
      const context = { requiredAction: "select-account" };
      const error = new AccountNotSelectedError(
        "Please select an account",
        context,
      );

      expect(error.message).toBe("Please select an account");
      expect(error.context).toEqual(context);
    });

    it("should create error without context", () => {
      const error = new AccountNotSelectedError("Simple account error");

      expect(error.message).toBe("Simple account error");
      expect(error.name).toBe("AccountNotSelectedError");
    });

    it("should be instanceof Error and AccountNotSelectedError", () => {
      const error = new AccountNotSelectedError("Test");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AccountNotSelectedError);
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

      expect(error.message).toBe("App not found");
      expect(error.context).toEqual(context);
    });

    it("should create error without context", () => {
      const error = new FailToOpenAppError("Simple app error");

      expect(error.message).toBe("Simple app error");
      expect(error.name).toBe("FailToOpenAppError");
    });

    it("should be instanceof Error and FailToOpenAppError", () => {
      const error = new FailToOpenAppError("Test");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FailToOpenAppError);
    });
  });

  describe("Error inheritance and stack traces", () => {
    it("should preserve stack traces for all error types", () => {
      const errors = [
        new DeviceConnectionError("Test", { type: "failed-to-connect" }),
        new SignTransactionError("Test"),
        new AccountNotSelectedError("Test"),
        new FailToOpenAppError("Test"),
      ];

      errors.forEach((error) => {
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain("errors.spec.ts");
      });
    });

    it("should be catchable as Error", () => {
      const errors = [
        new DeviceConnectionError("Test", { type: "failed-to-connect" }),
        new SignTransactionError("Test"),
        new AccountNotSelectedError("Test"),
        new FailToOpenAppError("Test"),
      ];

      errors.forEach((error) => {
        try {
          throw error;
        } catch (e) {
          expect(e).toBeInstanceOf(Error);
        }
      });
    });
  });
});
