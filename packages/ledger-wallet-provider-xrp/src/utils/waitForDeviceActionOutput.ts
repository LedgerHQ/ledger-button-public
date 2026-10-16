import {
  type DeviceActionState,
  DeviceActionStatus,
  type DmkError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import type { Observable } from "rxjs";

export type DeviceActionExecution<Output> = {
  readonly observable: Observable<
    DeviceActionState<
      Output,
      DmkError,
      { readonly requiredUserInteraction: UserInteractionRequired }
    >
  >;
  readonly cancel: () => void;
};

/**
 * Resolves with the output of a DMK device action, reports every pending state
 * to `onPending`, and rejects with the device action error.
 */
export function waitForDeviceActionOutput<Output>(
  execution: DeviceActionExecution<Output>,
  onPending: (interaction: UserInteractionRequired) => void,
): Promise<Output> {
  return new Promise<Output>((resolve, reject) => {
    execution.observable.subscribe({
      next: (state) => {
        switch (state.status) {
          case DeviceActionStatus.Pending:
            onPending(
              state.intermediateValue?.requiredUserInteraction ??
                UserInteractionRequired.None,
            );
            break;
          case DeviceActionStatus.Completed:
            resolve(state.output);
            break;
          case DeviceActionStatus.Error:
            reject(state.error);
            break;
          case DeviceActionStatus.Stopped:
            reject(new Error("The device action was stopped"));
            break;
        }
      },
      error: reject,
    });
  });
}
