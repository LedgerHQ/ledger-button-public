export type XrpApiErrorCode = "NOT_CONNECTED" | "SUBMIT_FAILED";

/** Typed error rejected by the dApp-facing XrpAPI methods. */
export class XrpApiError extends Error {
  constructor(
    public readonly code: XrpApiErrorCode,
    message: string,
    /** XRPL preliminary result (`temMALFORMED`, `tefPAST_SEQ`...), when the node gave one. */
    public readonly engineResult?: string,
  ) {
    super(message);
    this.name = "XrpApiError";
  }
}
