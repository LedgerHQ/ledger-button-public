import { MockInstance } from "vitest";

import { Config } from "@internal/config/model/config";

import { LOG_LEVELS } from "../model/constant";
import { ConsoleLoggerSubscriber } from "./ConsoleLoggerSubscriber";
import { LoggerSubscriber } from "./LoggerSubscriber";

let ConsoleLogger: LoggerSubscriber;
let debugSpy: MockInstance;
let infoSpy: MockInstance;
let warnSpy: MockInstance;
let errorSpy: MockInstance;
let groupSpy: MockInstance;
let groupEndSpy: MockInstance;
let config: Config;

describe("ConsoleLoggerSubscriber", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-24T16:05:37.110Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    debugSpy = vi
      .spyOn(console, "debug")
      .mockImplementation(() => {
        // do nothing
      });
    infoSpy = vi
      .spyOn(console, "info")
      .mockImplementation(() => {
        // do nothing
      });
    warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {
        // do nothing
      });
    errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {
        // do nothing
      });
    groupSpy = vi
      .spyOn(console, "group")
      .mockImplementation(() => {
        // do nothing
      });
    groupEndSpy = vi
      .spyOn(console, "groupEnd")
      .mockImplementation(() => {
        // do nothing
      });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("log", () => {
    describe("when the level is debug", () => {
      beforeEach(() => {
        config = new Config({
          originToken: "test-token",
          dAppIdentifier: "test-app",
          logLevel: "debug",
        });
        ConsoleLogger = new ConsoleLoggerSubscriber(config);
      });

      it("should log", () => {
        ConsoleLogger.log(LOG_LEVELS.debug, "test", {
          tag: "test",
          data: { test: "debug" },
          timestamp: new Date().toISOString(),
        });

        expect(groupSpy).toHaveBeenCalledWith(
          "%c[test]: 2025-06-24T16:05:37.110Z",
          "color: darkcyan",
        );

        expect(debugSpy).toHaveBeenCalledWith(
          "%ctest",
          "color: darkcyan",
          expect.objectContaining({ test: "debug" }),
        );

        expect(groupEndSpy).toHaveBeenCalled();
      });

      it("should log all levels", () => {
        ConsoleLogger.log(LOG_LEVELS.debug, "test debug", {
          tag: "test",
          data: { test: "debug" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.info, "test info", {
          tag: "test",
          data: { test: "info" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.warn, "test warn", {
          tag: "test",
          data: { test: "warn" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.error, "test error", {
          tag: "test",
          data: { test: "error", error: new Error("test error") },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.fatal, "test fatal", {
          tag: "test",
          data: { test: "fatal" },
          timestamp: new Date().toISOString(),
        });

        expect(debugSpy).toHaveBeenCalledWith(
          "%ctest debug",
          "color: darkcyan",
          expect.objectContaining({ test: "debug" }),
        );
        expect(infoSpy).toHaveBeenCalledWith(
          "%ctest info",
          "color: green",
          expect.objectContaining({ test: "info" }),
        );
        expect(warnSpy).toHaveBeenCalledWith(
          "%ctest warn",
          "color: darkorange",
          expect.objectContaining({ test: "warn" }),
        );

        expect(errorSpy).toHaveBeenNthCalledWith(
          1,
          "%ctest error",
          "color: red",
          expect.objectContaining({
            test: "error",
            error: new Error("test error"),
          }),
        );

        expect(errorSpy).toHaveBeenNthCalledWith(
          2,
          "%ctest fatal",
          "color: white; background: red",
          expect.objectContaining({ test: "fatal" }),
        );
      });
    });

    describe("when the level is info", () => {
      beforeEach(() => {
        config = new Config({
          originToken: "test-token",
          dAppIdentifier: "test-app",
          logLevel: "info",
        });
        ConsoleLogger = new ConsoleLoggerSubscriber(config);
      });

      it("should log", () => {
        ConsoleLogger.log(LOG_LEVELS.info, "test info", {
          tag: "test",
          data: { test: "info" },
          timestamp: new Date().toISOString(),
        });

        expect(groupSpy).toHaveBeenCalledWith(
          "%c[test]: 2025-06-24T16:05:37.110Z",
          "color: green",
        );

        expect(infoSpy).toHaveBeenCalledWith(
          "%ctest info",
          "color: green",
          expect.objectContaining({ test: "info" }),
        );

        expect(groupEndSpy).toHaveBeenCalled();
      });

      it("should log all levels except debug", () => {
        ConsoleLogger.log(LOG_LEVELS.debug, "test debug", {
          tag: "test",
          data: { test: "debug" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.info, "test info", {
          tag: "test",
          data: { test: "info" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.warn, "test warn", {
          tag: "test",
          data: { test: "warn" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.error, "test error", {
          tag: "test",
          data: { test: "error" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.fatal, "test fatal", {
          tag: "test",
          data: { test: "fatal" },
          timestamp: new Date().toISOString(),
        });

        expect(debugSpy).not.toHaveBeenCalled();
        expect(infoSpy).toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledTimes(2);
      });
    });

    describe("when maxLevel is warn", () => {
      beforeEach(() => {
        config = new Config({
          originToken: "test-token",
          dAppIdentifier: "test-app",
          logLevel: "warn",
        });
        ConsoleLogger = new ConsoleLoggerSubscriber(config);
      });

      it("should log", () => {
        ConsoleLogger.log(LOG_LEVELS.warn, "test warn", {
          tag: "test",
          data: { test: "warn" },
          timestamp: new Date().toISOString(),
        });

        expect(groupSpy).toHaveBeenCalledWith(
          "%c[test]: 2025-06-24T16:05:37.110Z",
          "color: darkorange",
        );

        expect(warnSpy).toHaveBeenCalledWith(
          "%ctest warn",
          "color: darkorange",
          expect.objectContaining({ test: "warn" }),
        );

        expect(groupEndSpy).toHaveBeenCalled();
      });

      it("should log warn, error, and fatal levels", () => {
        ConsoleLogger.log(LOG_LEVELS.warn, "test warn", {
          tag: "test",
          data: { test: "warn" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.error, "test error", {
          tag: "test",
          data: { test: "error" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.fatal, "test fatal", {
          tag: "test",
          data: { test: "fatal" },
          timestamp: new Date().toISOString(),
        });

        expect(warnSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledTimes(2);
      });

      it("should not log debug and info levels", () => {
        ConsoleLogger.log(LOG_LEVELS.debug, "test debug", {
          tag: "test",
          data: { test: "debug" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.info, "test info", {
          tag: "test",
          data: { test: "info" },
          timestamp: new Date().toISOString(),
        });

        expect(debugSpy).not.toHaveBeenCalled();
        expect(infoSpy).not.toHaveBeenCalled();
      });
    });

    describe("when maxLevel is error", () => {
      beforeEach(() => {
        config = new Config({
          originToken: "test-token",
          dAppIdentifier: "test-app",
          logLevel: "error",
        });
        ConsoleLogger = new ConsoleLoggerSubscriber(config);
      });

      it("should log", () => {
        ConsoleLogger.log(LOG_LEVELS.error, "test error", {
          tag: "test",
          data: { test: "error" },
          timestamp: new Date().toISOString(),
        });

        expect(groupSpy).toHaveBeenCalledWith(
          "%c[test]: 2025-06-24T16:05:37.110Z",
          "color: red",
        );

        expect(errorSpy).toHaveBeenCalledWith(
          "%ctest error",
          "color: red",
          expect.objectContaining({ test: "error" }),
        );

        expect(groupEndSpy).toHaveBeenCalled();
      });

      it("should log error and fatal levels", () => {
        ConsoleLogger.log(LOG_LEVELS.error, "test error", {
          tag: "test",
          data: { test: "error" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.fatal, "test fatal", {
          tag: "test",
          data: { test: "fatal" },
          timestamp: new Date().toISOString(),
        });

        expect(errorSpy).toHaveBeenCalledTimes(2);
      });

      it("should not log debug, info, and warn levels", () => {
        ConsoleLogger.log(LOG_LEVELS.debug, "test debug", {
          tag: "test",
          data: { test: "debug" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.info, "test info", {
          tag: "test",
          data: { test: "info" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.warn, "test warn", {
          tag: "test",
          data: { test: "warn" },
          timestamp: new Date().toISOString(),
        });

        expect(debugSpy).not.toHaveBeenCalled();
        expect(infoSpy).not.toHaveBeenCalled();
        expect(warnSpy).not.toHaveBeenCalled();
      });
    });

    describe("when maxLevel is fatal", () => {
      beforeEach(() => {
        config = new Config({
          originToken: "test-token",
          dAppIdentifier: "test-app",
          logLevel: "fatal",
        });
        ConsoleLogger = new ConsoleLoggerSubscriber(config);
      });

      it("should log", () => {
        ConsoleLogger.log(LOG_LEVELS.fatal, "test fatal", {
          tag: "test",
          data: { test: "fatal" },
          timestamp: new Date().toISOString(),
        });

        expect(groupSpy).toHaveBeenCalledWith(
          "%c[test]: 2025-06-24T16:05:37.110Z",
          "color: white; background: red",
        );

        expect(errorSpy).toHaveBeenCalledWith(
          "%ctest fatal",
          "color: white; background: red",
          expect.objectContaining({ test: "fatal" }),
        );

        expect(groupEndSpy).toHaveBeenCalled();
      });

      it("should log only fatal level", () => {
        ConsoleLogger.log(LOG_LEVELS.fatal, "test fatal", {
          tag: "test",
          data: { test: "fatal" },
          timestamp: new Date().toISOString(),
        });

        expect(errorSpy).toHaveBeenCalled();
      });

      it("should not log debug, info, warn, and error levels", () => {
        ConsoleLogger.log(LOG_LEVELS.debug, "test debug", {
          tag: "test",
          data: { test: "debug" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.info, "test info", {
          tag: "test",
          data: { test: "info" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.warn, "test warn", {
          tag: "test",
          data: { test: "warn" },
          timestamp: new Date().toISOString(),
        });

        ConsoleLogger.log(LOG_LEVELS.error, "test error", {
          tag: "test",
          data: { test: "error" },
          timestamp: new Date().toISOString(),
        });

        expect(debugSpy).not.toHaveBeenCalled();
        expect(infoSpy).not.toHaveBeenCalled();
        expect(warnSpy).not.toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
      });
    });
  });
});
