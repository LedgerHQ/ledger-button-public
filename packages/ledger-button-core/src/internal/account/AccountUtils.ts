import { Account } from "./service/AccountService.js";
import { getEvmDerivationPath } from "../evm-provider/utils/derivationUtils.js";
import { isSupportedSolanaCurrency } from "../solana-provider/utils/clusterUtils.js";
import { getSolanaDerivationPath } from "../solana-provider/utils/derivationUtils.js";

export function getDerivationPath(account: Account): string {
  if (isSupportedSolanaCurrency(account.currencyId)) {
    return getSolanaDerivationPath(account);
  }

  return getEvmDerivationPath(account);
}
