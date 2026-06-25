import { ContainerModule } from "inversify";

import { DefaultGasFeeEstimationService } from "./ledger-eip1193/gas-fee/DefaultGasFeeEstimationService.js";
import { GasFeeEstimationService } from "./ledger-eip1193/gas-fee/GasFeeEstimationService.js";
import { LedgerRemoteDatasource } from "./ledger-eip1193/jsonrpc/datasource/LedgerRemoteDatasource.js";
import { StubLedgerRemoteDatasource } from "./ledger-eip1193/jsonrpc/datasource/StubLedgerRemoteDatasource.js";
import { JSONRPCCallUseCase } from "./ledger-eip1193/jsonrpc/use-case/JSONRPCRequest.js";
import { BroadcastTransaction } from "./ledger-eip1193/use-case/BroadcastTransaction.js";
import { BuildContextModule } from "./ledger-eip1193/use-case/BuildContextModule.js";
import { BuildEthSigner } from "./ledger-eip1193/use-case/BuildEthSigner.js";
import { SignPersonalMessageUseCase } from "./ledger-eip1193/use-case/SignPersonalMessageUseCase.js";
import { SignRawTransaction } from "./ledger-eip1193/use-case/SignRawTransaction.js";
import { SignTransaction } from "./ledger-eip1193/use-case/SignTransaction.js";
import { SignTypedData } from "./ledger-eip1193/use-case/SignTypedData.js";
import type { CoreFacade } from "../blockchain-provider/model/BlockchainProvider.js";
import type { DAppConfigV2 } from "../dAppConfig/v2/model/dAppConfigV2Types.js";
import { navigationModuleTypes } from "../navigation/navigationModuleTypes.js";
import type { NavigationIntentService } from "../navigation/service/NavigationIntentService.js";
import { pendingTransactionModuleTypes } from "../pending-transaction/pendingTransactionModuleTypes.js";
import type { TrackBroadcastedTransactionUseCase } from "../pending-transaction/use-case/TrackBroadcastedTransactionUseCase.js";
import {
  EvmBlockchainProvider,
  type EvmBlockchainProviderFactory,
} from "./EvmBlockchainProvider.js";
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

    bind<GasFeeEstimationService>(
      evmProviderModuleTypes.GasFeeEstimationService,
    )
      .to(DefaultGasFeeEstimationService)
      .inSingletonScope();

    bind<EvmBlockchainProviderFactory>(
      evmProviderModuleTypes.EvmBlockchainProviderFactory,
    ).toFactory((context) => {
      return (core: CoreFacade, dappConfig: DAppConfigV2) =>
        new EvmBlockchainProvider(core, dappConfig, {
          navigationIntentService: context.get<NavigationIntentService>(
            navigationModuleTypes.NavigationIntentService,
          ),
          signTransaction: context.get<SignTransaction>(
            evmProviderModuleTypes.SignTransactionUseCase,
          ),
          signRawTransaction: context.get<SignRawTransaction>(
            evmProviderModuleTypes.SignRawTransactionUseCase,
          ),
          signTypedData: context.get<SignTypedData>(
            evmProviderModuleTypes.SignTypedDataUseCase,
          ),
          signPersonalMessage: context.get<SignPersonalMessageUseCase>(
            evmProviderModuleTypes.SignPersonalMessageUseCase,
          ),
          trackBroadcastedTransaction:
            context.get<TrackBroadcastedTransactionUseCase>(
              pendingTransactionModuleTypes.TrackBroadcastedTransactionUseCase,
            ),
        });
    });

    if (stub) {
      rebindSync(evmProviderModuleTypes.LedgerRemoteDatasource).to(
        StubLedgerRemoteDatasource,
      );
    }
  });
}
