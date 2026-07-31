import type { ProviderAccount } from "../../../../api/model/blockchain/ProviderAccount.js";

const EVM_DERIVATION_MODE: Record<string, string> = {
  // MEW legacy derivation for eth
  ethM: "44'/60'/0'/<account>",
  // MetaMask style
  ethMM: "44'/60'/0'/0/<account>",
  // MEW legacy derivation for ethereum classic
  etcM: "44'/60'/160720'/0'/<account>",
};

export function getEvmDerivationPath(account: ProviderAccount): string {
  const index = account.index;

  const derivationScheme = EVM_DERIVATION_MODE[account.derivationMode];
  if (derivationScheme) {
    return derivationScheme.replace("<account>", index.toString());
  }

  // Default Ledger Live derivation path mode (BIP44 purpose 44, coin-type 60)
  return `44'/60'/${index}'/0/0`;
}
