import type {
  BlockchainFamily,
  CurrencyDescriptor,
  ProviderAccount,
} from "@ledgerhq/ledger-wallet-provider-core";

export const XRP_FAMILY = "xrp" satisfies BlockchainFamily;
export const XRP_NATIVE_DECIMALS = 6; // 1 XRP = 1_000_000 drops

/**
 * Ledger Wallet currency id → XRPL `network_id` (`"0"` mainnet, `"1"` testnet).
 * The `network_id` is also the Button backend chain id and the network the XRP
 * API reports to the dApp.
 *
 * `ripple_devnet` is not supported by coin-service, so
 * balance and transaction history cannot be fetched.
 */
export const XRP_MAPPING_TABLE: Record<string, string> = {
  ripple: "0",
  ripple_testnet: "1",
};

export const DEFAULT_XRP_NETWORK_ID = "0";

/** BIP44, coin type 144. Ledger Wallet accounts: 44'/144'/<account>'/0/0 (secp256k1). */
export function getXrpDerivationPath(account: ProviderAccount): string {
  return `44'/144'/${account.index}'/0/0`;
}

export function getNetworkIdFromCurrencyId(currencyId: string): string {
  return XRP_MAPPING_TABLE[currencyId] ?? DEFAULT_XRP_NETWORK_ID;
}

export function getCurrencyIdFromNetworkId(
  networkId: string,
): string | undefined {
  return Object.keys(XRP_MAPPING_TABLE).find(
    (currencyId) => XRP_MAPPING_TABLE[currencyId] === networkId,
  );
}

export function isSupportedXrpCurrency(currencyId: string): boolean {
  return Object.hasOwn(XRP_MAPPING_TABLE, currencyId);
}

export function describeXrpCurrency(
  currencyId: string,
): CurrencyDescriptor | undefined {
  if (!isSupportedXrpCurrency(currencyId)) {
    return undefined;
  }
  return {
    currencyId,
    family: XRP_FAMILY,
    networkId: getNetworkIdFromCurrencyId(currencyId),
    nativeDecimals: XRP_NATIVE_DECIMALS,
  };
}

export function describeXrpNetwork(
  networkId: string,
): CurrencyDescriptor | undefined {
  const currencyId = getCurrencyIdFromNetworkId(networkId);
  if (!currencyId) {
    return undefined;
  }
  return describeXrpCurrency(currencyId);
}
