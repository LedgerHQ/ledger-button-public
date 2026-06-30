import { Container } from "inversify";

import { LedgerEIP1193Provider } from "./ledger-eip1193/LedgerEIP1193Provider.js";
import type { SignPersonalMessageUseCase } from "./ledger-eip1193/use-case/SignPersonalMessageUseCase.js";
import type { SignRawTransaction } from "./ledger-eip1193/use-case/SignRawTransaction.js";
import type { SignTransaction } from "./ledger-eip1193/use-case/SignTransaction.js";
import type { SignTypedData } from "./ledger-eip1193/use-case/SignTypedData.js";
import { isSupportedEvmCurrency } from "./ledger-eip1193/utils/chainUtils.js";
import type { BlockchainProvider } from "../../api/blockchain-provider/model/BlockchainProvider.js";
import type { CoreFacade } from "../../api/blockchain-provider/model/CoreFacade.js";
import type { BlockchainFamily } from "../../api/blockchain-provider/model/types.js";
import type { ProviderAccount } from "../../api/model/blockchain/ProviderAccount.js";
import type { BlockchainConfig } from "../../api/model/dappConfig/BlockchainConfig.js";
import { evmProviderModule } from "./evmProviderModule.js";
import { evmProviderModuleTypes } from "./evmProviderModuleTypes.js";
import { EvmWalletProvider } from "./EvmWalletProvider.js";

/**
 * EVM {@link BlockchainProvider}: entry point for the EVM family.
 *
 * Owns a self-contained Inversify container that binds the host
 * {@link CoreFacade} and the per-provider {@link BlockchainConfig} as constants,
 * then wires every EVM sign-flow collaborator on top of them. Nothing outside
 * this package is required, which keeps the module a candidate for extraction.
 */
export class EvmBlockchainProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = "evm";

  private readonly container: Container;
  private eip1193Provider?: LedgerEIP1193Provider;
  private walletProvider?: EvmWalletProvider;

  constructor(
    private readonly core: CoreFacade,
    public readonly dappConfig: BlockchainConfig,
  ) {
    this.container = new Container();
    this.container
      .bind<CoreFacade>(evmProviderModuleTypes.CoreFacade)
      .toConstantValue(this.core);
    this.container
      .bind<BlockchainConfig>(evmProviderModuleTypes.BlockchainConfig)
      .toConstantValue(this.dappConfig);
    this.container.loadSync(evmProviderModule());
  }

  injectWalletProviders(): void {
    this.eip1193Provider = new LedgerEIP1193Provider(
      this.core,
      {
        signTransaction: this.container.get<SignTransaction>(
          evmProviderModuleTypes.SignTransactionUseCase,
        ),
        signRawTransaction: this.container.get<SignRawTransaction>(
          evmProviderModuleTypes.SignRawTransactionUseCase,
        ),
        signTypedData: this.container.get<SignTypedData>(
          evmProviderModuleTypes.SignTypedDataUseCase,
        ),
        signPersonalMessage: this.container.get<SignPersonalMessageUseCase>(
          evmProviderModuleTypes.SignPersonalMessageUseCase,
        ),
      },
      () => Promise.resolve(this.dappConfig.rpcMethods),
    );
    this.walletProvider = new EvmWalletProvider(this.eip1193Provider);
    this.walletProvider.init();
  }

  setSelectedAccount(account: ProviderAccount | undefined): void {
    this.eip1193Provider?.setSelectedAccount(account);
  }

  setNetwork(chainId: number): void {
    this.eip1193Provider?.setNetwork(chainId);
  }

  isSupportedCurrency(currencyId: string): boolean {
    return isSupportedEvmCurrency(currencyId);
  }
}
