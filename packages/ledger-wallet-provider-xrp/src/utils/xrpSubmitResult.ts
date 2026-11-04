import type { BroadcastResponse } from "@ledgerhq/ledger-wallet-provider-core";
import {
  isCoinServiceBroadcastResponse,
  isRippledResponse,
} from "@ledgerhq/ledger-wallet-provider-core";

import { XrpSubmitFailedError } from "../model/XrpApiError";

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

/**
 * Throws an {@link XrpSubmitFailedError} unless the node accepted or
 * queued the transaction. Unexpected response shapes are failures too: a
 * success must not be reported on a response that cannot be read.
 */
export function assertSubmitAccepted(response: BroadcastResponse): void {
  if (isCoinServiceBroadcastResponse(response)) {
    return;
  }
  if (!isRippledResponse(response)) {
    throw new XrpSubmitFailedError("unexpected response");
  }

  const { status, error, error_message, engine_result, engine_result_message } =
    response.result;

  if (status === "error") {
    throw new XrpSubmitFailedError(String(error_message ?? error ?? "unknown error"));
  }
  if (typeof engine_result !== "string") {
    throw new XrpSubmitFailedError("response has no engine_result");
  }
  if (!ACCEPTED_ENGINE_RESULTS.has(engine_result)) {
    const detail =
      typeof engine_result_message === "string"
        ? `${engine_result}: ${engine_result_message}`
        : engine_result;
    throw new XrpSubmitFailedError(detail, engine_result);
  }
}
