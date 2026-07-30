import { ContainerModule } from "inversify";

import { SolanaRemoteDatasource } from "./ledger-solana-wallet/rpc/datasource/SolanaRemoteDatasource.js";
import { StubSolanaRemoteDatasource } from "./ledger-solana-wallet/rpc/datasource/StubSolanaRemoteDatasource.js";
import { BuildSolanaContextModule } from "./ledger-solana-wallet/use-case/BuildSolanaContextModule.js";
import { SignSolanaTransaction } from "./ledger-solana-wallet/use-case/SignSolanaTransaction.js";
import { SignSolanaMessage } from "./use-case/SignSolanaMessage.js";
import { solanaProviderModuleTypes } from "./solanaProviderModuleTypes.js";

type SolanaProviderModuleOptions = {
  stub?: boolean;
};

/**
 * Root-container module for the Solana provider: currently only the RPC
 * datasource (with a stub switch). Loaded in {@link createContainer}.
 */
export function solanaProviderModuleFactory({
  stub,
}: SolanaProviderModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind(solanaProviderModuleTypes.SolanaRemoteDatasource).to(
      SolanaRemoteDatasource,
    );

    if (stub) {
      rebindSync(solanaProviderModuleTypes.SolanaRemoteDatasource).to(
        StubSolanaRemoteDatasource,
      );
    }
  });
}

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
