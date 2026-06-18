import { LedgerEIP1193Provider } from "./ledger-eip1193/LedgerEIP1193Provider.js";
import type { Account } from "../account/service/AccountService.js";
import type {
  BlockchainFamily,
  BlockchainProvider,
  ProviderDAppConfig,
  ProviderDAppConfigFactory,
  WalletProvider,
  WalletProviderCore,
} from "../blockchain-provider/model/BlockchainProvider.js";
import { EvmWalletProvider } from "./EvmWalletProvider.js";

/**
 * EVM {@link BlockchainProvider}: entry point for the EVM family.
 *
 * Creates the inner {@link LedgerEIP1193Provider} and the {@link EvmWalletProvider}
 * (EIP-6963 announcer), then forwards context updates from core to the provider.
 */
export class EvmBlockchainProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = "evm";
  private readonly eip1193Provider: LedgerEIP1193Provider;
  private readonly walletProvider: EvmWalletProvider;

  constructor(
    host: WalletProviderCore,
    private readonly configFactory?: ProviderDAppConfigFactory,
  ) {
    this.eip1193Provider = new LedgerEIP1193Provider(host, () =>
      this.getDAppConfig().then((config) => config?.rpcMethods),
    );
    this.walletProvider = new EvmWalletProvider(this.eip1193Provider);
  }

  getWalletProvider(): WalletProvider {
    return this.walletProvider;
  }

  setSelectedAccount(account: Account | undefined): void {
    this.eip1193Provider.setSelectedAccount(account);
  }

  setNetwork(chainId: number): void {
    this.eip1193Provider.setNetwork(chainId);
  }

  private getDAppConfig(): Promise<ProviderDAppConfig | undefined> {
    return this.configFactory?.(this.family) ?? Promise.resolve(undefined);
  }
}
