import type {
  BlockchainConfig,
  BlockchainNetwork,
  BlockchainProvider,
  BlockchainProviderFactory,
  CoreFacade,
  CurrencyDescriptor,
  ProviderAccount,
} from "@ledgerhq/ledger-wallet-provider-core";
import { findBlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import { Container } from "inversify";
import { Left, Right } from "purify-ts";

import { xrpProviderModule } from "./di/xrpProviderModule";
import { xrpProviderModuleTypes } from "./di/xrpProviderModuleTypes";
import type { SignXrpTransaction } from "./use-case/SignXrpTransaction";
import {
  describeXrpCurrency,
  describeXrpNetwork,
  getXrpNetwork,
  XRP_FAMILY,
} from "./utils/xrpUtils";
import { XrpWalletProvider } from "./XrpWalletProvider";
import { XrpWalletProviderInjector } from "./XrpWalletProviderInjector";

/**
 * Draft XRP {@link BlockchainProvider}: entry point for the XRP family.
 *
 * Owns a self-contained Inversify container that binds the host
 * {@link CoreFacade} and the per-provider {@link BlockchainConfig} as constants,
 * then wires the XRP sign-flow collaborators on top of them, mirroring
 * `SolanaBlockchainProvider`.
 */
export class XrpBlockchainProvider implements BlockchainProvider<
  typeof XRP_FAMILY
> {
  public readonly family = XRP_FAMILY;

  private readonly container: Container;
  private walletProvider?: XrpWalletProvider;
  private injector?: XrpWalletProviderInjector;

  constructor(
    private readonly core: CoreFacade,
    public readonly dappConfig: BlockchainConfig,
    private readonly network: BlockchainNetwork,
  ) {
    this.container = new Container();
    this.container
      .bind<CoreFacade>(xrpProviderModuleTypes.CoreFacade)
      .toConstantValue(this.core);
    this.container
      .bind<BlockchainConfig>(xrpProviderModuleTypes.BlockchainConfig)
      .toConstantValue(this.dappConfig);
    this.container.loadSync(xrpProviderModule());
  }

  injectWalletProvider(): void {
    this.walletProvider = new XrpWalletProvider(
      this.core,
      this.container.get<SignXrpTransaction>(
        xrpProviderModuleTypes.SignTransactionUseCase,
      ),
      this.network,
    );
    this.injector = new XrpWalletProviderInjector(this.walletProvider);
    this.injector.inject();
  }

  async disconnect(): Promise<void> {
    await this.walletProvider?.disconnect();
  }

  setSelectedAccount(account: ProviderAccount | undefined): void {
    this.walletProvider?.setSelectedAccount(account);
  }

  setNetwork(_chainId: number): void {
    // A single XRPL network is served for now: the first one in the dApp config.
  }

  describeCurrency(currencyId: string): CurrencyDescriptor | undefined {
    return describeXrpCurrency(this.network, currencyId);
  }

  describeNetwork(networkId: string): CurrencyDescriptor | undefined {
    return describeXrpNetwork(this.network, networkId);
  }
}

export const xrpBlockchainProviderFactory: BlockchainProviderFactory<
  typeof XRP_FAMILY
> = (core: CoreFacade, blockchains: BlockchainConfig[]) => {
  const config = findBlockchainConfig(blockchains, XRP_FAMILY);
  const network = config && getXrpNetwork(config);
  if (!config || !network) return Left(XRP_FAMILY);
  return Right(new XrpBlockchainProvider(core, config, network));
};
