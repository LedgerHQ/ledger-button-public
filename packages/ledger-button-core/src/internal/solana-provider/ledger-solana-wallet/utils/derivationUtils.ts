import { Account } from "../../../account/service/AccountService.js";

// Solana uses Ed25519 keypairs with a coin-type of 501. As per SLIP-0010 all
// derivation-path indexes are promoted to hardened. Ledger Live derives Solana
// accounts on several schemes depending on the account derivation mode.
const SOLANA_DERIVATION_MODE: Record<string, string> = {
  solanaMain: "44'/501'",
  solanaBip44Change: "44'/501'/<account>'/0'",
  solanaSub: "44'/501'/<account>'",
};

const DEFAULT_SOLANA_DERIVATION_MODE = "solanaSub";

export function getSolanaDerivationPath(account: Account): string {
  const index = account.index;

  const derivationScheme =
    SOLANA_DERIVATION_MODE[account.derivationMode] ??
    SOLANA_DERIVATION_MODE[DEFAULT_SOLANA_DERIVATION_MODE];

  return derivationScheme.replace("<account>", index.toString());
}
