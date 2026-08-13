import { Container } from "inversify";

import type { BlockchainProvider } from "@api/blockchain-provider/model/BlockchainProvider.js";
import type { CoreFacade } from "@api/blockchain-provider/model/CoreFacade.js";
import type { BlockchainFamily } from "@api/blockchain-provider/model/types.js";
import type { ProviderAccount } from "@api/model/blockchain/ProviderAccount.js";
import type { BlockchainConfig } from "@api/model/dappConfig/BlockchainConfig.js";

import { solanaProviderModule } from "./di/solanaProviderModule.js";
import { solanaProviderModuleTypes } from "./di/solanaProviderModuleTypes.js";
import type { SignSolanaMessage } from "./use-case/SignSolanaMessage.js";
import type { SignSolanaTransaction } from "./use-case/SignSolanaTransaction.js";
import { isSupportedSolanaCurrency } from "./utils/clusterUtils.js";
import { LedgerSolanaWallet } from "./LedgerSolanaWallet.js";
import { SolanaWalletProvider } from "./SolanaWalletProvider.js";

/**
 * Solana {@link BlockchainProvider}: entry point for the Solana family.
 *
 * Owns a self-contained Inversify container that binds the host
 * {@link CoreFacade} and the per-provider {@link BlockchainConfig} as constants,
 * then wires the Solana sign-flow collaborators on top of them, mirroring
 * {@link EvmBlockchainProvider}.
 */
export class SolanaBlockchainProvider implements BlockchainProvider {
  public readonly family: BlockchainFamily = "solana";

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

  isSupportedCurrency(currencyId: string): boolean {
    return isSupportedSolanaCurrency(currencyId);
  }
}
