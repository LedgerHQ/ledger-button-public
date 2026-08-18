import { NetworkServiceOpts } from "@internal/network/model/types";

import { LedgerButtonError } from "./LedgerButtonError";

export class BroadcastTransactionError extends LedgerButtonError<{
  error: Error;
}> {
  constructor(message: string, context: { error: Error }) {
    super(message, "BroadcastTransactionError", context);
  }
}

export class NetworkError extends LedgerButtonError<{
  status: number;
  url: string;
  options?: NetworkServiceOpts;
  body?: unknown;
}> {
  constructor(
    message: string,
    context: {
      status: number;
      url: string;
      options?: NetworkServiceOpts;
      body?: unknown;
    },
  ) {
    super(message, "NetworkError", context);
  }
}
