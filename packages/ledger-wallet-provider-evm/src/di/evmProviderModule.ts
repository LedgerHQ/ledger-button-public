import { ContainerModule } from "inversify";

import { DefaultGasFeeEstimationService } from "../gas-fee/DefaultGasFeeEstimationService.js";
import { type GasFeeEstimationService } from "../gas-fee/GasFeeEstimationService.js";
import { BroadcastTransaction } from "../use-case/BroadcastTransaction.js";
import { BuildContextModule } from "../use-case/BuildContextModule.js";
import { BuildEthSigner } from "../use-case/BuildEthSigner.js";
import { SignPersonalMessageUseCase } from "../use-case/SignPersonalMessageUseCase.js";
import { SignRawTransaction } from "../use-case/SignRawTransaction.js";
import { SignTransaction } from "../use-case/SignTransaction.js";
import { SignTypedData } from "../use-case/SignTypedData.js";
import { evmProviderModuleTypes } from "./evmProviderModuleTypes.js";

/**
 * Local Inversify module for the EVM provider. Loaded into the per-provider
 * container owned by {@link EvmBlockchainProvider}, on top of the
 * {@link evmProviderModuleTypes.CoreFacade} and
 * {@link evmProviderModuleTypes.BlockchainConfig} constants bound there.
 */
export function evmProviderModule() {
  return new ContainerModule(({ bind }) => {
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

    bind<GasFeeEstimationService>(
      evmProviderModuleTypes.GasFeeEstimationService,
    )
      .to(DefaultGasFeeEstimationService)
      .inSingletonScope();
  });
}
