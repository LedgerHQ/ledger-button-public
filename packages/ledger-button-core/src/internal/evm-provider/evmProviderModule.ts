import { ContainerModule } from "inversify";

import { DefaultGasFeeEstimationService } from "./ledger-eip1193/gas-fee/DefaultGasFeeEstimationService.js";
import { type GasFeeEstimationService } from "./ledger-eip1193/gas-fee/GasFeeEstimationService.js";
import { BroadcastTransaction } from "./ledger-eip1193/use-case/BroadcastTransaction.js";
import { BuildContextModule } from "./ledger-eip1193/use-case/BuildContextModule.js";
import { BuildEthSigner } from "./ledger-eip1193/use-case/BuildEthSigner.js";
import { SignPersonalMessageUseCase } from "./ledger-eip1193/use-case/SignPersonalMessageUseCase.js";
import { SignRawTransaction } from "./ledger-eip1193/use-case/SignRawTransaction.js";
import { SignTransaction } from "./ledger-eip1193/use-case/SignTransaction.js";
import { SignTypedData } from "./ledger-eip1193/use-case/SignTypedData.js";
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
