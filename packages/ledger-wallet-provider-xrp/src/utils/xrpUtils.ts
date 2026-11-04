import type {
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

/*
 * XRP networks come from the dApp config (`networks` of the `xrp` entry), the
 * single source of truth: a network `id` is the XRPL `network_id` (`"0"`
 * mainnet, `"1"` testnet), which is also the Button backend chain id and the
 * network the XRP API reports to the dApp. A currency or network missing from
 * the config is unsupported, with no fallback to mainnet.
 */

export function findXrpNetworkByCurrencyId(
  networks: readonly BlockchainNetwork[],
  currencyId: string,
): BlockchainNetwork | undefined {
  return networks.find((network) => network.currencyId === currencyId);
}

export function findXrpNetworkById(
  networks: readonly BlockchainNetwork[],
  networkId: string,
): BlockchainNetwork | undefined {
  return networks.find((network) => network.id === networkId);
}

function toCurrencyDescriptor(network: BlockchainNetwork): CurrencyDescriptor {
  return {
    currencyId: network.currencyId,
    family: XRP_FAMILY,
    networkId: network.id,
    nativeDecimals: XRP_NATIVE_DECIMALS,
  };
}

export function describeXrpCurrency(
  networks: readonly BlockchainNetwork[],
  currencyId: string,
): CurrencyDescriptor | undefined {
  const network = findXrpNetworkByCurrencyId(networks, currencyId);
  return network && toCurrencyDescriptor(network);
}

export function describeXrpNetwork(
  networks: readonly BlockchainNetwork[],
  networkId: string,
): CurrencyDescriptor | undefined {
  const network = findXrpNetworkById(networks, networkId);
  return network && toCurrencyDescriptor(network);
}
