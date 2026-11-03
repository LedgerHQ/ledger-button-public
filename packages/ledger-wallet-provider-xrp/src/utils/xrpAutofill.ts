import type { BroadcastResponse } from "@ledgerhq/ledger-wallet-provider-core";
import { isJsonRpcResponseSuccess } from "@ledgerhq/ledger-wallet-provider-core";

import { XrpApiError } from "../model/XrpApiError";
import type { XrpTransaction } from "./xrpTransaction";

/** Ledgers the transaction stays valid for (about a minute), as in xrpl.js. */
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
 * Fills the fields the network decides, when the dApp left them out:
 * `Sequence` (`account_info`), `Fee` (`server_info`) and `LastLedgerSequence`
 * (`ledger`). Fields the dApp set are kept as is.
 *
 * Same rules as xrpl.js `autofill`, limited to the methods the button backend
 * allows. The fee is the open ledger cost of a standard transaction: the
 * special fees of `AccountDelete`, `EscrowFinish` with a fulfillment or
 * multi-signing are not computed, so the dApp sets `Fee` for those.
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
    throw autofillFailed("server_info", "no validated_ledger.base_fee_xrp");
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

/** The `result` of a successful reply; rippled reports failures inside it. */
async function call(
  request: XrplRequest,
  method: string,
  params: Record<string, unknown>,
): Promise<XrplResult> {
  const response = await request(method, params);
  const result = isJsonRpcResponseSuccess(response)
    ? asObject(response.result)
    : undefined;
  if (!result) {
    throw autofillFailed(
      method,
      "error" in response ? response.error.message : "unexpected response",
    );
  }
  if (result.status === "error") {
    throw autofillFailed(
      method,
      String(result.error_message ?? result.error ?? "unknown error"),
    );
  }
  return result;
}

function readInteger(method: string, value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw autofillFailed(method, `unexpected ${field} ${String(value)}`);
  }
  return value;
}

function asObject(value: unknown): XrplResult | undefined {
  return typeof value === "object" && value !== null
    ? (value as XrplResult)
    : undefined;
}

function autofillFailed(method: string, reason: string): XrpApiError {
  return new XrpApiError(
    "AUTOFILL_FAILED",
    `XRPL autofill failed (${method}): ${reason}`,
  );
}
