import { ContainerModule } from "inversify";

import { BuildSolanaContextModule } from "../use-case/BuildSolanaContextModule";
import { SignSolanaMessage } from "../use-case/SignSolanaMessage";
import { SignSolanaTransaction } from "../use-case/SignSolanaTransaction";
import { solanaProviderModuleTypes } from "./solanaProviderModuleTypes";

/**
 * Local Inversify module for the Solana provider. Loaded into the per-provider
 * container owned by {@link SolanaBlockchainProvider}, on top of the
 * {@link solanaProviderModuleTypes.CoreFacade} and
 * {@link solanaProviderModuleTypes.BlockchainConfig} constants bound there.
 */
export function solanaProviderModule() {
  return new ContainerModule(({ bind }) => {
    bind(solanaProviderModuleTypes.SignSolanaMessageUseCase).to(
      SignSolanaMessage,
    );
    bind(solanaProviderModuleTypes.SignTransactionUseCase).to(
      SignSolanaTransaction,
    );
    bind(solanaProviderModuleTypes.BuildContextModuleUseCase).to(
      BuildSolanaContextModule,
    );
  });
}
