import type { SignedResults } from "./SignedTransaction.js";

/**
 * Compile-time sanity check: {@link SignedResults} must never collapse to
 * `never`. Core always contributes the shared transport result shapes; family
 * packages may widen the union further via {@link SignedResultRegistry}.
 */
type AssertTrue<T extends true> = T;

export type SignedResultsAreRegistered = AssertTrue<
  [SignedResults] extends [never] ? false : true
>;
