import type { BroadcastResponse } from "@ledgerhq/ledger-wallet-provider-core";
import {
  isCoinServiceBroadcastResponse,
  isJsonRpcResponseSuccess,
} from "@ledgerhq/ledger-wallet-provider-core";

import { XrpApiError } from "../model/XrpApiError";

/**
 * Preliminary results of XRPL `submit` that mean the transaction was taken:
 * `tesSUCCESS` (applied to the open ledger) and `terQUEUED` (held in the
 * node's queue, to be applied in a later ledger). Anything else, including the
 * other `ter*` retry codes and the `tec*` codes where the fee is claimed but the
 * transaction fails, is reported as a failure.
 */
const ACCEPTED_ENGINE_RESULTS: ReadonlySet<string> = new Set([
  "tesSUCCESS",
  "terQUEUED",
]);

type XrplSubmitResult = {
  readonly status?: unknown;
  readonly error?: unknown;
  readonly error_message?: unknown;
  readonly engine_result?: unknown;
  readonly engine_result_message?: unknown;
};

/**
 * Throws a `SUBMIT_FAILED` {@link XrpApiError} unless the node accepted or
 * queued the transaction. Unexpected response shapes are failures too: a
 * success must not be reported on a response that cannot be read.
 */
export function assertSubmitAccepted(response: BroadcastResponse): void {
  if (isCoinServiceBroadcastResponse(response)) {
    return;
  }
  if (!isJsonRpcResponseSuccess(response)) {
    throw submitFailed(
      "error" in response ? response.error.message : "no result in response",
    );
  }

  const result = response.result;
  if (typeof result !== "object" || result === null) {
    throw submitFailed("unexpected response");
  }

  const { status, error, error_message, engine_result, engine_result_message } =
    result as XrplSubmitResult;

  if (status === "error") {
    throw submitFailed(String(error_message ?? error ?? "unknown error"));
  }
  if (typeof engine_result !== "string") {
    throw submitFailed("response has no engine_result");
  }
  if (!ACCEPTED_ENGINE_RESULTS.has(engine_result)) {
    const detail =
      typeof engine_result_message === "string"
        ? `${engine_result}: ${engine_result_message}`
        : engine_result;
    throw submitFailed(detail, engine_result);
  }
}

function submitFailed(reason: string, engineResult?: string): XrpApiError {
  return new XrpApiError(
    "SUBMIT_FAILED",
    `XRPL submit failed: ${reason}`,
    engineResult,
  );
}
