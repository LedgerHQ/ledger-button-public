export type XrpApiErrorCode = "NOT_CONNECTED";

/** Typed error rejected by the dApp-facing XrpAPI methods. */
export class XrpApiError extends Error {
  constructor(
    public readonly code: XrpApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "XrpApiError";
  }
}
