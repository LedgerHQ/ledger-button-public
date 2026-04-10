import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IsLedgerLiveMobileUseCase } from "./IsLedgerLiveMobileUseCase.js";

describe("IsLedgerLiveMobileUseCase", () => {
  let useCase: IsLedgerLiveMobileUseCase;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    useCase = new IsLedgerLiveMobileUseCase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow === undefined) {
      // @ts-expect-error -- restoring undefined window for SSR test
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it("should return false when window is undefined", () => {
    // @ts-expect-error -- simulating SSR environment
    delete globalThis.window;

    expect(useCase.execute()).toBe(false);
  });

  it("should return false when window.ethereum does not exist", () => {
    expect(useCase.execute()).toBe(false);
  });

  it("should return false when ethereum.isLedgerLive is false", () => {
    vi.stubGlobal("ethereum", { isLedgerLive: false });
    Object.defineProperty(window, "ethereum", {
      value: { isLedgerLive: false },
      writable: true,
      configurable: true,
    });

    expect(useCase.execute()).toBe(false);
  });

  it("should return false when ethereum.isLedgerLive is undefined", () => {
    Object.defineProperty(window, "ethereum", {
      value: {},
      writable: true,
      configurable: true,
    });

    expect(useCase.execute()).toBe(false);
  });

  it("should return true when ethereum.isLedgerLive is true", () => {
    Object.defineProperty(window, "ethereum", {
      value: { isLedgerLive: true },
      writable: true,
      configurable: true,
    });

    expect(useCase.execute()).toBe(true);
  });
});
