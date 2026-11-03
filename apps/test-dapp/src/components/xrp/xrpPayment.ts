// Public cluster that allows browser CORS requests. The provider does not
// autofill yet, so the test dApp fills Sequence / Fee / LastLedgerSequence.
const XRPL_NODE_URL = "https://xrplcluster.com/";
const LAST_LEDGER_OFFSET = 20;
const TF_FULLY_CANONICAL_SIG = 2147483648;

type RippledResponse<T> = {
  result: T & { status: string; error?: string; error_message?: string };
};

async function callRippled<T>(
  method: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(XRPL_NODE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params: [params] }),
  });
  const { result } = (await response.json()) as RippledResponse<T>;
  if (result.status !== "success") {
    throw new Error(
      `${method}: ${result.error_message ?? result.error ?? "request failed"}`,
    );
  }
  return result;
}

// Same set the provider accepts: applied, or queued for a later ledger.
const ACCEPTED_ENGINE_RESULTS = new Set(["tesSUCCESS", "terQUEUED"]);

type SubmitResult = {
  engine_result: string;
  engine_result_message: string;
  tx_json: { hash: string };
};

/**
 * Submits a signed transaction to the public node.
 * @todo: Use the provider's signAndSubmit once the button backend supports XRP
 * (backend `NetworkFamily` and the chain id, LBD-913).
 */
export async function submitTransaction(txBlob: string): Promise<SubmitResult> {
  const result = await callRippled<SubmitResult>("submit", {
    tx_blob: txBlob,
  });
  if (!ACCEPTED_ENGINE_RESULTS.has(result.engine_result)) {
    throw new Error(
      `submit: ${result.engine_result} (${result.engine_result_message})`,
    );
  }
  return result;
}

export type PaymentValues = {
  destination: string;
  amountDrops: string;
};

export async function buildPayment(
  account: string,
  { destination, amountDrops }: PaymentValues,
): Promise<Record<string, unknown>> {
  const [accountInfo, fee, ledger] = await Promise.all([
    callRippled<{ account_data: { Sequence: number } }>("account_info", {
      account,
      ledger_index: "current",
    }),
    callRippled<{ drops: { open_ledger_fee: string } }>("fee"),
    // `ledger_current` is not reliable on the public cluster: depending on the
    // server that answers, the index comes back as `ledger_index` or
    // `ledger_current_index`. `ledger` on the validated ledger is stable.
    callRippled<{ ledger_index: number }>("ledger", {
      ledger_index: "validated",
    }),
  ]);
  const lastLedgerSequence = Number(ledger.ledger_index) + LAST_LEDGER_OFFSET;
  if (!Number.isInteger(lastLedgerSequence)) {
    throw new Error(
      `ledger: unexpected ledger_index ${String(ledger.ledger_index)}`,
    );
  }

  return {
    TransactionType: "Payment",
    Account: account,
    Destination: destination,
    Amount: amountDrops,
    Flags: TF_FULLY_CANONICAL_SIG,
    Sequence: accountInfo.account_data.Sequence,
    Fee: fee.drops.open_ledger_fee,
    LastLedgerSequence: lastLedgerSequence,
  };
}
