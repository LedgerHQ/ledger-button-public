import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainFamily } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainProvider } from "@ledgerhq/ledger-wallet-provider-core";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { CurrencyDescriptor } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import { Container } from "inversify";

import { solanaProviderModule } from "./di/solanaProviderModule";
import { solanaProviderModuleTypes } from "./di/solanaProviderModuleTypes";
import type { SignSolanaMessage } from "./use-case/SignSolanaMessage";
import type { SignSolanaTransaction } from "./use-case/SignSolanaTransaction";
import {
  describeSolanaCurrency,
  describeSolanaNetwork,
  SOLANA_FAMILY,
} from "./utils/clusterUtils";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet";
import { SolanaWalletProvider } from "./SolanaWalletProvider";

/**
 * Solana {@link BlockchainProvider}: entry point for the Solana family.
 *
 * Owns a self-contained Inversify container that binds the host
 * {@link CoreFacade} and the per-provider {@link BlockchainConfig} as constants,
 * then wires the Solana sign-flow collaborators on top of them, mirroring
 * {@link EvmBlockchainProvider}.
 */
export class SolanaBlockchainProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = SOLANA_FAMILY;

  private readonly container: Container;
  private wallet?: LedgerSolanaWallet;
  private walletProvider?: SolanaWalletProvider;

  constructor(
    private readonly core: CoreFacade,
    public readonly dappConfig: BlockchainConfig,
  ) {
    this.container = new Container();
    this.container
      .bind<CoreFacade>(solanaProviderModuleTypes.CoreFacade)
      .toConstantValue(this.core);
    this.container
      .bind<BlockchainConfig>(solanaProviderModuleTypes.BlockchainConfig)
      .toConstantValue(this.dappConfig);
    this.container.loadSync(solanaProviderModule());
  }

  injectWalletProviders(): void {
    this.wallet = new LedgerSolanaWallet(this.core, {
      signSolanaMessage: this.container.get<SignSolanaMessage>(
        solanaProviderModuleTypes.SignSolanaMessageUseCase,
      ),
      signSolanaTransaction: this.container.get<SignSolanaTransaction>(
        solanaProviderModuleTypes.SignTransactionUseCase,
      ),
    });
    this.walletProvider = new SolanaWalletProvider(this.wallet);
    this.walletProvider.init();
  }

  setSelectedAccount(account: ProviderAccount | undefined): void {
    this.wallet?.setSelectedAccount(account);
  }

  setNetwork(chainId: number): void {
    this.wallet?.setNetwork(chainId);
  }

  describeCurrency(currencyId: string): CurrencyDescriptor | undefined {
    return describeSolanaCurrency(currencyId);
  }

  describeNetwork(networkId: string): CurrencyDescriptor | undefined {
    return describeSolanaNetwork(networkId);
  }
}
