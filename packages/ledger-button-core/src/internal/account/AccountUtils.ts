import { Account } from "./service/AccountService.js";
import { getEvmDerivationPath } from "../evm-provider/ledger-eip1193/utils/derivationUtils.js";
import { isSupportedSolanaCurrency } from "../solana-provider/ledger-solana-wallet/utils/clusterUtils.js";
import { getSolanaDerivationPath } from "../solana-provider/ledger-solana-wallet/utils/derivationUtils.js";

export function getDerivationPath(account: Account): string {
  if (isSupportedSolanaCurrency(account.currencyId)) {
    return getSolanaDerivationPath(account);
  }

  return getEvmDerivationPath(account);
}
