import type { BlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainProvider } from "@ledgerhq/ledger-wallet-provider-core";
import type { BlockchainProviderFactory } from "@ledgerhq/ledger-wallet-provider-core";
import type { CoreFacade } from "@ledgerhq/ledger-wallet-provider-core";
import type { CurrencyDescriptor } from "@ledgerhq/ledger-wallet-provider-core";
import type { ProviderAccount } from "@ledgerhq/ledger-wallet-provider-core";
import { findBlockchainConfig } from "@ledgerhq/ledger-wallet-provider-core";
import { Container } from "inversify";
import { Left, Right } from "purify-ts";

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
export class SolanaBlockchainProvider implements BlockchainProvider<
  typeof SOLANA_FAMILY
> {
  public readonly family = SOLANA_FAMILY;

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

  async disconnect(): Promise<void> {
    await this.wallet?.disconnect();
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

/**
 * Pre-built factory for Solana. Pass directly into
 * `blockchainProviderFactories` on {@link LedgerButtonCore} options.
 *
 * @example
 * ```ts
 * initializeLedgerProvider({
 *   blockchainProviderFactories: [solanaBlockchainProviderFactory],
 * });
 * ```
 */
export const solanaBlockchainProviderFactory: BlockchainProviderFactory<
  typeof SOLANA_FAMILY
> = (core: CoreFacade, blockchains: BlockchainConfig[]) => {
  const config = findBlockchainConfig(blockchains, SOLANA_FAMILY);
  if (!config) return Left(SOLANA_FAMILY);
  return Right(new SolanaBlockchainProvider(core, config));
};
