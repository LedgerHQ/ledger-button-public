import {
  LedgerEIP1193Provider,
  type LedgerEIP1193ProviderDeps,
} from "./ledger-eip1193/LedgerEIP1193Provider.js";
import type { Account } from "../account/service/AccountService.js";
import type {
  BlockchainFamily,
  BlockchainProvider,
  CoreFacade,
  ProviderRpcMethods,
} from "../blockchain-provider/model/BlockchainProvider.js";
import { resolveBlockchainFamily } from "../blockchain-provider/utils/resolveBlockchainFamily.js";
import type { DAppConfigV2 } from "../dAppConfig/v2/model/dAppConfigV2Types.js";
import { EvmWalletProvider } from "./EvmWalletProvider.js";

/**
 * EVM-owned collaborators the provider needs to run the complete sign flow
 * internally (navigation bridge + sign use-cases + broadcast tracking).
 */
export type EvmBlockchainProviderDeps = LedgerEIP1193ProviderDeps;

/**
 * Factory that resolves the EVM sign-flow dependencies from DI and builds a
 * fully-wired {@link EvmBlockchainProvider}. Bound in {@link evmProviderModule}
 * and consumed by {@link DefaultBlockchainProviderManager} so the provider can
 * stay a plain (non-injectable) class while still receiving DI-built use-cases.
 */
export type EvmBlockchainProviderFactory = (
  core: CoreFacade,
  dappConfig: DAppConfigV2,
) => EvmBlockchainProvider;

/**
 * EVM {@link BlockchainProvider}: entry point for the EVM family.
 *
 * Created by {@link DefaultBlockchainProviderManager} through the EVM factory
 * with core, dApp config and its sign-flow dependencies; wiring happens in
 * {@link injectWalletProviders}.
 */
export class EvmBlockchainProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = "evm";
  private eip1193Provider?: LedgerEIP1193Provider;
  private walletProvider?: EvmWalletProvider;

  constructor(
    private readonly core: CoreFacade,
    private readonly dappConfig: DAppConfigV2,
    private readonly deps: EvmBlockchainProviderDeps,
  ) {}

  injectWalletProviders(): void {
    const rpcMethods = this.extractRpcMethods(this.dappConfig);
    this.eip1193Provider = new LedgerEIP1193Provider(this.core, this.deps, () =>
      Promise.resolve(rpcMethods),
    );
    this.walletProvider = new EvmWalletProvider(this.eip1193Provider);
    this.walletProvider.init();
  }

  setSelectedAccount(account: Account | undefined): void {
    this.eip1193Provider?.setSelectedAccount(account);
  }

  setNetwork(chainId: number): void {
    this.eip1193Provider?.setNetwork(chainId);
  }

  private extractRpcMethods(
    dappConfig: DAppConfigV2,
  ): ProviderRpcMethods | undefined {
    const entry = dappConfig.blockchains?.find((blockchain) =>
      blockchain.networks?.some(
        (network) =>
          resolveBlockchainFamily(network.currencyId).extract() === "evm",
      ),
    );
    return entry?.rpcMethods;
  }
}
