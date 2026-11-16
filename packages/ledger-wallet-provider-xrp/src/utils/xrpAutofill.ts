import type { BroadcastResponse } from "@ledgerhq/ledger-wallet-provider-core";
import { isRippledResponse } from "@ledgerhq/ledger-wallet-provider-core";

import { XrpAutofillFailedError } from "../model/XrpApiError";
import type { XrpTransaction } from "../model/XrpTransaction";

/**
 * In XRPL, a "ledger" is similar to a BTC "block". As in xrpl.js, the
 * transaction expires 20 ledgers (60 to 100 s) after the last validated one,
 * which leaves time to confirm it on the device.
 */
const LAST_LEDGER_SEQUENCE_OFFSET = 20;
const DROPS_PER_XRP = 1_000_000;
/** Fee ceiling: xrpl.js's default `maxFeeXRP` (2 XRP). */
const MAX_FEE_DROPS = 2 * DROPS_PER_XRP;

/** Sends one read-only XRPL request (`params` is rippled's single params object). */
export type XrplRequest = (
  method: string,
  params: Record<string, unknown>,
) => Promise<BroadcastResponse>;

type XrplResult = Record<string, unknown>;

/**
 * Autofills the fields the dApp left out (if any).
 *
 * - `Sequence`: from `account_info`, or `0` when the transaction uses a `TicketSequence`.
 * - `Fee`: `server_info` base fee × `load_factor`, capped at 2 XRP (as xrpl.js does).
 *   Only right for a standard transaction: the dApp must set `Fee` for
 *   `AccountDelete`, `EscrowFinish` with a fulfillment, or multi-signing.
 * - `LastLedgerSequence`: latest validated ledger + 20.
 */
export async function autofillTransaction(
  tx: XrpTransaction,
  account: string,
  request: XrplRequest,
): Promise<XrpTransaction> {
  const [Sequence, Fee, LastLedgerSequence] = await Promise.all([
    tx.Sequence ??
      (tx.TicketSequence !== undefined ? 0 : fetchSequence(account, request)),
    tx.Fee ?? fetchFee(request),
    tx.LastLedgerSequence ?? fetchLastLedgerSequence(request),
  ]);
  return { ...tx, Sequence, Fee, LastLedgerSequence };
}

async function fetchSequence(
  account: string,
  request: XrplRequest,
): Promise<number> {
  const result = await call(request, "account_info", {
    account,
    ledger_index: "current",
  });
  const accountData = asObject(result.account_data);
  return readInteger("account_info", accountData?.Sequence, "Sequence");
}

async function fetchFee(request: XrplRequest): Promise<string> {
  const result = await call(request, "server_info", {});
  const info = asObject(result.info);
  const baseFeeXrp = asObject(info?.validated_ledger)?.base_fee_xrp;
  if (typeof baseFeeXrp !== "number") {
    throw new XrpAutofillFailedError("server_info", "no validated_ledger.base_fee_xrp");
  }
  const loadFactor =
    typeof info?.load_factor === "number" ? info.load_factor : 1;

  const baseFeeDrops = Math.round(baseFeeXrp * DROPS_PER_XRP);
  return String(Math.min(Math.ceil(baseFeeDrops * loadFactor), MAX_FEE_DROPS));
}

async function fetchLastLedgerSequence(request: XrplRequest): Promise<number> {
  const result = await call(request, "ledger", { ledger_index: "validated" });
  const ledgerIndex = readInteger(
    "ledger",
    Number(result.ledger_index),
    "ledger_index",
  );
  return ledgerIndex + LAST_LEDGER_SEQUENCE_OFFSET;
}

async function call(
  request: XrplRequest,
  method: string,
  params: Record<string, unknown>,
): Promise<XrplResult> {
  const response = await request(method, params).catch((error: unknown) => {
    throw XrpAutofillFailedError.requestFailed(method, error);
  });
  if (!isRippledResponse(response)) {
    throw new XrpAutofillFailedError(method, "unexpected response");
  }
  const { result } = response;
  if (result.status === "error") {
    throw new XrpAutofillFailedError(
      method,
      String(result.error_message ?? result.error ?? "unknown error"),
    );
  }
  return result;
}

function readInteger(method: string, value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new XrpAutofillFailedError(method, `unexpected ${field} ${String(value)}`);
  }
  return value;
}

function asObject(value: unknown): XrplResult | undefined {
  return typeof value === "object" && value !== null
    ? (value as XrplResult)
    : undefined;
}
