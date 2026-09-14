import type {
  BlockchainFamily,
  BlockchainNetwork,
  CurrencyDescriptor,
} from "@ledgerhq/ledger-wallet-provider-core";

export const EVM_NATIVE_DECIMALS = 18;
export const EVM_FAMILY = "ethereum" satisfies BlockchainFamily;

/**
 * Runtime registry of EVM networks derived from the dApp config supplied at
 * provider construction time. It is the single source of truth for
 * currencyId ↔ chainId resolution inside the EVM provider, replacing the
 * hard-coded static mapping table.
 *
 * Networks that were added as local overrides (developer settings) are
 * automatically included because the core merges overrides into the dApp config
 * before the provider is built.
 */
export class EvmNetworkRegistry {
  private readonly byCurrencyId: Map<string, BlockchainNetwork>;
  private readonly byChainId: Map<number, BlockchainNetwork>;

  constructor(networks: BlockchainNetwork[]) {
    this.byCurrencyId = new Map(
      networks.map((network) => [network.currencyId, network]),
    );
    this.byChainId = new Map(
      networks.map((network) => [Number(network.id), network]),
    );
  }

  getChainIdFromCurrencyId(currencyId: string): number | undefined {
    const network = this.byCurrencyId.get(currencyId);
    return network ? Number(network.id) : undefined;
  }

  getCurrencyIdFromChainId(chainId: number): string | undefined {
    return this.byChainId.get(chainId)?.currencyId;
  }

  isSupportedCurrencyId(currencyId: string): boolean {
    return this.byCurrencyId.has(currencyId);
  }

  isSupportedChainId(chainId: number): boolean {
    return this.byChainId.has(chainId);
  }

  describeCurrency(currencyId: string): CurrencyDescriptor | undefined {
    const chainId = this.getChainIdFromCurrencyId(currencyId);
    if (chainId === undefined) return undefined;

    return {
      currencyId,
      family: EVM_FAMILY,
      networkId: String(chainId),
      nativeDecimals: EVM_NATIVE_DECIMALS,
    };
  }

  describeNetwork(networkId: string): CurrencyDescriptor | undefined {
    const chainId = Number(networkId);
    if (!Number.isFinite(chainId)) return undefined;

    const currencyId = this.getCurrencyIdFromChainId(chainId);
    if (!currencyId) return undefined;

    return {
      currencyId,
      family: EVM_FAMILY,
      networkId,
      nativeDecimals: EVM_NATIVE_DECIMALS,
    };
  }
}
