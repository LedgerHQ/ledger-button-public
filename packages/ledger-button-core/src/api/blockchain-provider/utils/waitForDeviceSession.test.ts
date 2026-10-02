import { firstValueFrom } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeviceDisconnectedError } from "@api/errors/DeviceErrors";
import { createMockCoreFacade } from "@internal/blockchain-provider/__mocks__/coreFacadeMock";

import type { ProviderDeviceSession } from "../model/types";
import { waitForDeviceSession } from "./waitForDeviceSession";

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

  it("fails with a DeviceDisconnectedError when no session shows up in time", async () => {
    vi.useFakeTimers();
    const getDeviceSession = vi.fn().mockReturnValue(notConnected);
    const core = createMockCoreFacade({ getDeviceSession });

    const promise = firstValueFrom(waitForDeviceSession(core, 200, 1000));
    const assertion = expect(promise).rejects.toBeInstanceOf(
      DeviceDisconnectedError,
    );
    await vi.advanceTimersByTimeAsync(1000);

    await assertion;
  });

  it("keeps waiting when a stale session reports connected without a session id", async () => {
    vi.useFakeTimers();
    const staleSession: ProviderDeviceSession = {
      dmk: {} as never,
      sessionId: undefined,
      isConnected: true,
    };
    const getDeviceSession = vi
      .fn()
      .mockReturnValueOnce(staleSession)
      .mockReturnValue(connected);
    const core = createMockCoreFacade({ getDeviceSession });

    const promise = firstValueFrom(waitForDeviceSession(core, 200, 1000));
    await vi.advanceTimersByTimeAsync(200);

    await expect(promise).resolves.toMatchObject({ sessionId: "session-1" });
  });
});
