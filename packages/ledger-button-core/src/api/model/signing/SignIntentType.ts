import type { SignType } from "./SignFlowStatus";

/**
 * What the user is being asked to approve, as surfaced to the UI.
 *
 * The UI only ever needs this binary distinction (it drives the success copy
 * and whether a broadcast can follow), so the richer {@link SignType} used
 * inside the sign flows is collapsed here rather than duplicated on the
 * navigation boundary.
 */
export type SignIntentType = "transaction" | "message";

export function toSignIntentType(signType: SignType): SignIntentType {
  return signType === "transaction" ? "transaction" : "message";
}
