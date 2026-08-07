import type {
  BroadcastedTransactionResult,
  SignedPersonalMessageOrTypedDataResult,
  SignedTransactionResult,
} from "../../../api/model/signing/SignedTransaction.js";

/**
 * Results the EVM sign flow can emit. Owned by the EVM provider and used by its
 * own narrowing helpers and use-case return types. The shared `SignedResults`
 * transport union derives from it via the registry augmentation below, so `api`
 * never depends on this family folder.
 */
export type EvmSignedResult =
  | BroadcastedTransactionResult
  | SignedTransactionResult
  | SignedPersonalMessageOrTypedDataResult;

declare module "../../../api/model/signing/SignedTransaction.js" {
  interface SignedResultRegistry {
    evm: EvmSignedResult;
  }
}
