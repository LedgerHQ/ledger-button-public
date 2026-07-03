import type {
  Account,
  PendingTransaction,
} from "@ledgerhq/ledger-wallet-provider-core";

export type AccountIdentity = Pick<Account, "freshAddress" | "currencyId">;

/**
 * Pending transactions are persisted globally in session storage and emitted
 * unfiltered by the core layer. A given tx is scoped to a single account
 * identity (sender address on a specific chain), so checking both
 * `freshAddress` and `currencyId` is required: the same address can be reused
 * across EVM chains and we must not leak a Polygon tx into the Ethereum view.
 */
export function belongsToAccount(
  tx: PendingTransaction,
  account: AccountIdentity | undefined,
): boolean {
  if (!account) return false;
  return (
    tx.address === account.freshAddress && tx.ledgerId === account.currencyId
  );
}
