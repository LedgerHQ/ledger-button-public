import { ContainerModule } from "inversify";

import { SolanaRemoteDatasource } from "./rpc/datasource/SolanaRemoteDatasource.js";
import { StubSolanaRemoteDatasource } from "./rpc/datasource/StubSolanaRemoteDatasource.js";
import { SolanaRPCCallUseCase } from "./rpc/use-case/SolanaRPCRequest.js";
import { SendSolanaTransactionUseCase } from "./use-case/SendSolanaTransactionUseCase.js";
import { SignSolanaMessageUseCase } from "./use-case/SignSolanaMessageUseCase.js";
import { SignSolanaTransactionUseCase } from "./use-case/SignSolanaTransactionUseCase.js";
import { solanaProviderModuleTypes } from "./solanaProviderModuleTypes.js";

type SolanaProviderModuleOptions = {
  stub?: boolean;
};

export function solanaProviderModuleFactory({ stub }: SolanaProviderModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind(solanaProviderModuleTypes.SolanaRemoteDatasource).to(
      SolanaRemoteDatasource,
    );
    bind(solanaProviderModuleTypes.SolanaRPCCallUseCase).to(SolanaRPCCallUseCase);
    bind(solanaProviderModuleTypes.SignSolanaMessageUseCase).to(
      SignSolanaMessageUseCase,
    );
    bind(solanaProviderModuleTypes.SignSolanaTransactionUseCase).to(
      SignSolanaTransactionUseCase,
    );
    bind(solanaProviderModuleTypes.SendSolanaTransactionUseCase).to(
      SendSolanaTransactionUseCase,
    );

    if (stub) {
      rebindSync(solanaProviderModuleTypes.SolanaRemoteDatasource).to(
        StubSolanaRemoteDatasource,
      );
    }
  });
}
