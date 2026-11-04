export type XrpApiErrorCode =
  "NOT_CONNECTED" | "AUTOFILL_FAILED" | "SUBMIT_FAILED";

/** Typed error rejected by the dApp-facing XrpAPI methods. */
export class XrpApiError extends Error {
  constructor(
    public readonly code: XrpApiErrorCode,
    message: string,
    public readonly engineResult?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "XrpApiError";
  }
}

export class XrpNotConnectedError extends XrpApiError {
  constructor() {
    super("NOT_CONNECTED", "No account selected");
  }
}

export class XrpAutofillFailedError extends XrpApiError {
  constructor(method: string, reason: string, options?: ErrorOptions) {
    super(
      "AUTOFILL_FAILED",
      `XRPL autofill failed (${method}): ${reason}`,
      undefined,
      options,
    );
  }

  static requestFailed(method: string, cause: unknown): XrpAutofillFailedError {
    return new XrpAutofillFailedError(method, requestFailureReason(cause), {
      cause,
    });
  }
}

export class XrpSubmitFailedError extends XrpApiError {
  constructor(reason: string, engineResult?: string, options?: ErrorOptions) {
    super(
      "SUBMIT_FAILED",
      `XRPL submit failed: ${reason}`,
      engineResult,
      options,
    );
  }

  /**
   * The node may still have received the blob: resubmitting it is safe (same
   * hash, same `Sequence`).
   */
  static requestFailed(cause: unknown): XrpSubmitFailedError {
    return new XrpSubmitFailedError(requestFailureReason(cause), undefined, {
      cause,
    });
  }
}

function requestFailureReason(cause: unknown): string {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return `backend request failed: ${detail}`;
}
