import type { SignedResults } from "./SignedTransaction.js";

/**
 * Compile-time guard against the registry footgun. `SignedResults` derives from
 * the (initially empty) `SignedResultRegistry`, so if NO family augments it,
 * `SignedResults` collapses to `never` — which is silently assignable to
 * everything and would mask real errors.
 *
 * This file is checked but never re-exported from the public barrel. If it fails
 * to compile, a family augmentation is missing from the compilation: ensure each
 * family's `*SignedResult.ts` (which runs `declare module ... SignedResultRegistry`)
 * is loaded, and re-exported from `api/index.ts` so cross-package consumers pick
 * up the declaration merging.
 */
type AssertTrue<T extends true> = T;

export type SignedResultsAreRegistered = AssertTrue<
  [SignedResults] extends [never] ? false : true
>;
