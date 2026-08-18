import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainFamily } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainProvider } from "@ledgerhq/ledger-wallet-provider-core";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { CurrencyDescriptor } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import { Container } from "inversify";

import { evmProviderModule } from "./di/evmProviderModule";
import { evmProviderModuleTypes } from "./di/evmProviderModuleTypes";
import type { SignPersonalMessageUseCase } from "./use-case/SignPersonalMessageUseCase";
import type { SignRawTransaction } from "./use-case/SignRawTransaction";
import type { SignTransaction } from "./use-case/SignTransaction";
import type { SignTypedData } from "./use-case/SignTypedData";
import {
  describeEvmCurrency,
  describeEvmNetwork,
  EVM_FAMILY,
} from "./utils/chainUtils";
import { EvmWalletProvider } from "./EvmWalletProvider";
import { LedgerEIP1193Provider } from "./LedgerEIP1193Provider";

/**
 * EVM {@link BlockchainProvider}: entry point for the EVM family.
 *
 * Owns a self-contained Inversify container that binds the host
 * {@link CoreFacade} and the per-provider {@link BlockchainConfig} as constants,
 * then wires every EVM sign-flow collaborator on top of them. Nothing outside
 * this package is required, which keeps the module a candidate for extraction.
 */
export class EvmBlockchainProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = EVM_FAMILY;

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

  describeCurrency(currencyId: string): CurrencyDescriptor | undefined {
    return describeEvmCurrency(currencyId);
  }

  describeNetwork(networkId: string): CurrencyDescriptor | undefined {
    return describeEvmNetwork(networkId);
  }
}
