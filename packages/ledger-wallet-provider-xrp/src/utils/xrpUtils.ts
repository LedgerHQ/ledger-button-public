import type {
  BlockchainFamily,
  CurrencyDescriptor,
  ProviderAccount,
} from "@ledgerhq/ledger-wallet-provider-core";

export const XRP_FAMILY = "xrp" satisfies BlockchainFamily;
export const XRP_CURRENCY_ID = "ripple";
export const XRP_NATIVE_DECIMALS = 6; // 1 XRP = 1_000_000 drops
export const XRP_NETWORK_ID = "mainnet";

// TODO: confirm the chainId the button backend expects for XRPL (see Solana's "900").
export const XRP_BACKEND_CHAIN_ID = "TODO";

/** BIP44, coin type 144. Ledger Wallet accounts: 44'/144'/<account>'/0/0 (secp256k1). */
export function getXrpDerivationPath(account: ProviderAccount): string {
  return `44'/144'/${account.index}'/0/0`;
}

export function describeXrpCurrency(
  currencyId: string,
): CurrencyDescriptor | undefined {
  if (currencyId !== XRP_CURRENCY_ID) return undefined;
  return {
    currencyId,
    family: XRP_FAMILY,
    networkId: XRP_NETWORK_ID,
    nativeDecimals: XRP_NATIVE_DECIMALS,
  };
}

export function describeXrpNetwork(
  networkId: string,
): CurrencyDescriptor | undefined {
  return networkId === XRP_NETWORK_ID
    ? describeXrpCurrency(XRP_CURRENCY_ID)
    : undefined;
}
