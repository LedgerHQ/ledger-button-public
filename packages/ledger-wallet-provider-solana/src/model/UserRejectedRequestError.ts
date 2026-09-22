import {
  WALLET_STANDARD_ERROR__USER__REQUEST_REJECTED,
  WalletStandardError,
} from "@wallet-standard/errors";

/**
 * User rejection surfaced to dApps when a Solana request is dismissed.
 *
 * Stays a `WalletStandardError` carrying
 * `WALLET_STANDARD_ERROR__USER__REQUEST_REJECTED`, so
 * `isWalletStandardError(error, WALLET_STANDARD_ERROR__USER__REQUEST_REJECTED)`
 * keeps narrowing it, and restores the human-readable message that dApps match
 * on to tell a user rejection apart from a wallet failure.
 */
export class UserRejectedRequestError extends WalletStandardError<
  typeof WALLET_STANDARD_ERROR__USER__REQUEST_REJECTED
> {
  constructor() {
    super(WALLET_STANDARD_ERROR__USER__REQUEST_REJECTED);
    // `@wallet-standard/errors` strips human-readable messages from production
    // bundles, leaving only "Wallet Standard error #4001000", which dApps
    // matching on the message text cannot recognize as a user rejection.
    this.message = "User rejected the request.";
  }
}
