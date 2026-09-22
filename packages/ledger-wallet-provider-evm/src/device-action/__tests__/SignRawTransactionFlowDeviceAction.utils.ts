import { type DeviceActionState } from "@ledgerhq/device-management-kit";
import { type Observable, type Subscription } from "rxjs";

import type {
  SignRawTransactionFlowDAError,
  SignRawTransactionFlowDAIntermediateValue,
  SignRawTransactionFlowDAOutput,
} from "../SignRawTransactionFlowDeviceActionTypes";

export type SignRawTransactionFlowDAState = DeviceActionState<
  SignRawTransactionFlowDAOutput,
  SignRawTransactionFlowDAError,
  SignRawTransactionFlowDAIntermediateValue
>;

export const executeUntilStep = async <T>(
  targetStep: number,
  o: Observable<T>,
): Promise<{ steps: T[] }> =>
  await new Promise((resolve, reject) => {
    const steps: T[] = [];
    let index = 0;
    let subscription: Subscription | undefined = undefined;

    subscription = o.subscribe({
      next: (state) => {
        steps.push(state);
        index++;

        if (index > targetStep) {
          subscription?.unsubscribe();
          resolve({ steps });
        }
      },
      error: (error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        (err as Error & { steps: T[] }).steps = steps;
        reject(err);
      },
      complete: () => {
        resolve({ steps });
      },
    });
  });
