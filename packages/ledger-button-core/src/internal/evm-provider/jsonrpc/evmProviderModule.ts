import { ContainerModule } from "inversify";

import { LedgerRemoteDatasource } from "./datasource/LedgerRemoteDatasource.js";
import { StubLedgerRemoteDatasource } from "./datasource/StubLedgerRemoteDatasource.js";
import { JSONRPCCallUseCase } from "./use-case/JSONRPCRequest.js";
import { evmProviderModuleTypes } from "./evmProviderModuleTypes.js";

type EvmProviderModuleOptions = {
  stub?: boolean;
};

export function evmProviderModuleFactory({ stub }: EvmProviderModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind(evmProviderModuleTypes.LedgerRemoteDatasource).to(
      LedgerRemoteDatasource,
    );

    bind(evmProviderModuleTypes.JSONRPCCallUseCase).to(JSONRPCCallUseCase);

    if (stub) {
      rebindSync(evmProviderModuleTypes.LedgerRemoteDatasource).to(
        StubLedgerRemoteDatasource,
      );
    }
  });
}
