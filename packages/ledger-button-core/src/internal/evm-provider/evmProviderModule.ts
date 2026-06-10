import { ContainerModule } from "inversify";

import { DefaultGasFeeEstimationService } from "./gas-fee/DefaultGasFeeEstimationService.js";
import { GasFeeEstimationService } from "./gas-fee/GasFeeEstimationService.js";
import { LedgerRemoteDatasource } from "./jsonrpc/datasource/LedgerRemoteDatasource.js";
import { StubLedgerRemoteDatasource } from "./jsonrpc/datasource/StubLedgerRemoteDatasource.js";
import { JSONRPCCallUseCase } from "./jsonrpc/use-case/JSONRPCRequest.js";
import { BroadcastTransaction } from "./use-case/BroadcastTransaction.js";
import { BuildContextModule } from "./use-case/BuildContextModule.js";
import { BuildEthSigner } from "./use-case/BuildEthSigner.js";
import { SignPersonalMessageUseCase } from "./use-case/SignPersonalMessageUseCase.js";
import { SignRawTransaction } from "./use-case/SignRawTransaction.js";
import { SignTransaction } from "./use-case/SignTransaction.js";
import { SignTypedData } from "./use-case/SignTypedData.js";
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

    bind(evmProviderModuleTypes.SignTransactionUseCase).to(SignTransaction);
    bind(evmProviderModuleTypes.SignRawTransactionUseCase).to(
      SignRawTransaction,
    );
    bind(evmProviderModuleTypes.SignTypedDataUseCase).to(SignTypedData);
    bind(evmProviderModuleTypes.SignPersonalMessageUseCase).to(
      SignPersonalMessageUseCase,
    );
    bind(evmProviderModuleTypes.BroadcastTransactionUseCase).to(
      BroadcastTransaction,
    );
    bind(evmProviderModuleTypes.BuildContextModuleUseCase).to(
      BuildContextModule,
    );
    bind(evmProviderModuleTypes.BuildEthSignerUseCase).to(BuildEthSigner);

    bind<GasFeeEstimationService>(evmProviderModuleTypes.GasFeeEstimationService)
      .to(DefaultGasFeeEstimationService)
      .inSingletonScope();

    if (stub) {
      rebindSync(evmProviderModuleTypes.LedgerRemoteDatasource).to(
        StubLedgerRemoteDatasource,
      );
    }
  });
}
