import { LedgerEIP1193Provider } from "./ledger-eip1193/LedgerEIP1193Provider.js";
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
 * EVM {@link BlockchainProvider}: entry point for the EVM family.
 *
 * Created by {@link BlockchainProviderManager.injectWalletProviders};
 * wiring with core and dApp config happens in {@link injectWalletProviders}.
 */
export class EvmBlockchainProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = "evm";
  private eip1193Provider?: LedgerEIP1193Provider;
  private walletProvider?: EvmWalletProvider;

  injectWalletProviders(core: CoreFacade, dappConfig: DAppConfigV2): void {
    const rpcMethods = this.extractRpcMethods(dappConfig);
    this.eip1193Provider = new LedgerEIP1193Provider(core, () =>
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
