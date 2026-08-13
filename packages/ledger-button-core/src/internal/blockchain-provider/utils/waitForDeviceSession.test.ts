import { firstValueFrom } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProviderDeviceSession } from "@api/blockchain-provider/model/types.js";

import { createMockCoreFacade } from "../__mocks__/coreFacadeMock.js";
import { waitForDeviceSession } from "./waitForDeviceSession.js";

const notConnected: ProviderDeviceSession = {
  dmk: {} as never,
  sessionId: undefined,
  isConnected: false,
};

const connected: ProviderDeviceSession = {
  dmk: {} as never,
  sessionId: "session-1",
  isConnected: true,
};

describe("waitForDeviceSession", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls until a connected session is available, then emits it once and completes", async () => {
    vi.useFakeTimers();
    const getDeviceSession = vi
      .fn()
      .mockReturnValueOnce(notConnected)
      .mockReturnValueOnce(notConnected)
      .mockReturnValue(connected);
    const core = createMockCoreFacade({ getDeviceSession });

    const promise = firstValueFrom(waitForDeviceSession(core, 200));
    // Ticks at t=0 (not connected), t=200 (not connected), t=400 (connected).
    await vi.advanceTimersByTimeAsync(400);
    const session = await promise;

    // The type guard narrows to a connected session with a defined id.
    expect(session.sessionId).toBe("session-1");
    expect(session.isConnected).toBe(true);
    expect(getDeviceSession).toHaveBeenCalledTimes(3);
  });

  it("stops polling once it has emitted", async () => {
    vi.useFakeTimers();
    const getDeviceSession = vi.fn().mockReturnValue(connected);
    const core = createMockCoreFacade({ getDeviceSession });

    const promise = firstValueFrom(waitForDeviceSession(core, 200));
    // Fire the first tick (t=0), which already yields a connected session.
    await vi.advanceTimersByTimeAsync(0);
    await promise;
    expect(getDeviceSession).toHaveBeenCalledTimes(1);

    // No further reads after completion, even as time advances.
    await vi.advanceTimersByTimeAsync(1000);
    expect(getDeviceSession).toHaveBeenCalledTimes(1);
  });
});
