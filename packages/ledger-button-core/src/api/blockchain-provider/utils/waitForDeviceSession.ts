import { filter, first, map, type Observable, timer } from "rxjs";

import type { CoreFacade } from "../model/CoreFacade.js";
import type { ProviderDeviceSession } from "../model/types.js";

/** A device session guaranteed to be connected with a session id. */
export type ConnectedDeviceSession = ProviderDeviceSession & {
  sessionId: string;
  isConnected: true;
};

const DEFAULT_SESSION_POLL_INTERVAL_MS = 200;

/**
 * Emits once a connected device session (with a session id) is available, then
 * completes. The session is a synchronous snapshot with no reactive source, so
 * this polls {@link CoreFacade.getDeviceSession} until the session is defined.
 *
 * Family-neutral core/device helper shared by every blockchain provider.
 */
export function waitForDeviceSession(
  core: CoreFacade,
  pollIntervalMs: number = DEFAULT_SESSION_POLL_INTERVAL_MS,
): Observable<ConnectedDeviceSession> {
  return timer(0, pollIntervalMs).pipe(
    map(() => core.getDeviceSession()),
    filter(
      (session): session is ConnectedDeviceSession =>
        Boolean(session.sessionId) && session.isConnected,
    ),
    first(),
  );
}
