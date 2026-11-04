import type {
  BlockchainConfig,
  BlockchainFamily,
  BlockchainNetwork,
  CurrencyDescriptor,
  ProviderAccount,
} from "@ledgerhq/ledger-wallet-provider-core";

export const XRP_FAMILY = "xrp" satisfies BlockchainFamily;
export const XRP_NATIVE_DECIMALS = 6; // 1 XRP = 1_000_000 drops

/** BIP44, coin type 144. Ledger Wallet accounts: 44'/144'/<account>'/0/0 (secp256k1). */
export function getXrpDerivationPath(account: ProviderAccount): string {
  return `44'/144'/${account.index}'/0/0`;
}

/**
 * The XRPL network from the dApp config. Its `id` is the XRPL `network_id`
 * (`"0"` mainnet, `"1"` testnet): the Button backend chain id, and the
 * network the XRP API reports to the dApp. Only one network is served for now.
 */
export function getXrpNetwork(
  config: BlockchainConfig,
): BlockchainNetwork | undefined {
  return config.networks[0];
}

export function describeXrpCurrency(
  network: BlockchainNetwork,
  currencyId: string,
): CurrencyDescriptor | undefined {
  if (currencyId !== network.currencyId) return undefined;
  return {
    currencyId,
    family: XRP_FAMILY,
    networkId: network.id,
    nativeDecimals: XRP_NATIVE_DECIMALS,
  };
}

export function describeXrpNetwork(
  network: BlockchainNetwork,
  networkId: string,
): CurrencyDescriptor | undefined {
  return networkId === network.id
    ? describeXrpCurrency(network, network.currencyId)
    : undefined;
}
