import { ContainerModule } from "inversify";

import { SolanaRemoteDatasource } from "./ledger-solana-wallet/rpc/datasource/SolanaRemoteDatasource.js";
import { StubSolanaRemoteDatasource } from "./ledger-solana-wallet/rpc/datasource/StubSolanaRemoteDatasource.js";
import { solanaProviderModuleTypes } from "./solanaProviderModuleTypes.js";

type SolanaProviderModuleOptions = {
  stub?: boolean;
};

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
