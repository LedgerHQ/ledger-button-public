import type {
  CoreFacade,
  ProviderLogger,
  SignedResults,
  SignFlowStatus,
} from "@ledgerhq/ledger-wallet-provider-core";
import {
  normalizeSignFlowStatusError,
  toSignIntentType,
  UserRejectedTransactionError,
} from "@ledgerhq/ledger-wallet-provider-core";
import { type Observable, ReplaySubject, type Subscription } from "rxjs";

import { XRP_FAMILY } from "./xrpUtils";

type RunSignFlowArgs<T> = {
  readonly core: CoreFacade;
  readonly logger: ProviderLogger;
  readonly runUseCase: () => Observable<SignFlowStatus>;
  /** Returns `undefined` to keep waiting when the payload is not the expected shape. */
  readonly mapResult: (data: SignedResults) => T | undefined;
};

/**
 * Emits a navigation intent so the button UI renders and drives the sign
 * flow, runs the use case, and forwards every status to the modal and to core
 * for tracking. Resolves once `mapResult` accepts a success status.
 *
 * Errors surface in the modal so the user can retry; the promise only settles
 * on a mapped success or when the modal is closed.
 */
export function runSignFlow<T>({
  core,
  logger,
  runUseCase,
  mapResult,
}: RunSignFlowArgs<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const status$ = new ReplaySubject<SignFlowStatus>(1);
    let subscription: Subscription | undefined;
    let settled = false;

    const cleanup = () => {
      subscription?.unsubscribe();
      globalThis.removeEventListener?.("ledger-provider-close", onClose);
    };

    const onClose = () => {
      if (settled) {
        return;
      }
      settled = true;
      logger.debug("User closed the modal");
      cleanup();
      reject(new UserRejectedTransactionError("User closed the modal"));
    };

    const emitStatus = (status: SignFlowStatus) => {
      const normalized = normalizeSignFlowStatusError(status);
      core.trackBroadcastedTransaction(normalized, { family: XRP_FAMILY });
      status$.next(normalized);
    };

    const emitError = (error: unknown) =>
      emitStatus({ signType: "transaction", status: "error", error });

    const start = () => {
      subscription?.unsubscribe();
      let observable: Observable<SignFlowStatus>;
      try {
        observable = runUseCase();
      } catch (error) {
        emitError(error);
        return;
      }
      subscription = observable.subscribe({
        next: (status) => {
          emitStatus(status);
          if (status.status !== "success") {
            return;
          }
          const result = mapResult(status.data);
          if (result === undefined) {
            return;
          }
          settled = true;
          globalThis.removeEventListener?.("ledger-provider-close", onClose);
          resolve(result);
        },
        error: emitError,
      });
    };

    globalThis.addEventListener?.("ledger-provider-close", onClose);

    core.emitNavigationIntent({
      name: "signTransaction",
      params: {
        family: XRP_FAMILY,
        type: toSignIntentType("transaction"),
        broadcast: false,
      },
      status$: status$.asObservable(),
      retry: () => start(),
      finish: () => {
        cleanup();
        status$.complete();
      },
    });

    start();
  });
}
