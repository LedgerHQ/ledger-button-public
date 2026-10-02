import {
  filter,
  first,
  map,
  type Observable,
  throwError,
  timeout,
  timer,
} from "rxjs";

import { DeviceDisconnectedError } from "@api/errors/DeviceErrors";

import type { CoreFacade } from "../model/CoreFacade";
import type { ProviderDeviceSession } from "../model/types";

/** A device session guaranteed to be connected with a session id. */
export type ConnectedDeviceSession = ProviderDeviceSession & {
  sessionId: string;
  isConnected: true;
};

const DEFAULT_SESSION_POLL_INTERVAL_MS = 200;
const DEFAULT_SESSION_TIMEOUT_MS = 60_000;

/**
 * Emits once a connected device session (with a session id) is available, then
 * completes. The session is a synchronous snapshot with no reactive source, so
 * this polls {@link CoreFacade.getDeviceSession} until the session is defined.
 *
 * Errors with a {@link DeviceDisconnectedError} once `timeoutMs` elapses
 * without a session, so a sign flow started while the device goes away fails
 * visibly instead of polling forever.
 *
 * Family-neutral core/device helper shared by every blockchain provider.
 */
export function waitForDeviceSession(
  core: CoreFacade,
  pollIntervalMs: number = DEFAULT_SESSION_POLL_INTERVAL_MS,
  timeoutMs: number = DEFAULT_SESSION_TIMEOUT_MS,
): Observable<ConnectedDeviceSession> {
  return timer(0, pollIntervalMs).pipe(
    map(() => core.getDeviceSession()),
    filter(
      (session): session is ConnectedDeviceSession =>
        Boolean(session.sessionId) && session.isConnected,
    ),
    first(),
    timeout({
      first: timeoutMs,
      with: () =>
        throwError(
          () =>
            new DeviceDisconnectedError(
              "Timed out waiting for a connected device session",
            ),
        ),
    }),
  );
}
