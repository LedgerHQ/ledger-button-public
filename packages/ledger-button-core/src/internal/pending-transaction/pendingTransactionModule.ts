import { ContainerModule } from "inversify";

import { DefaultPendingTransactionController } from "./controller/DefaultPendingTransactionController.js";
import { DefaultPendingTransactionStorageService } from "./service/DefaultPendingTransactionStorageService.js";
import { ConfirmPendingTransactionsUseCase } from "./use-case/ConfirmPendingTransactionsUseCase.js";
import { TrackBroadcastedTransactionUseCase } from "./use-case/TrackBroadcastedTransactionUseCase.js";
import { pendingTransactionModuleTypes } from "./pendingTransactionModuleTypes.js";

export function pendingTransactionModuleFactory() {
  return new ContainerModule(({ bind }) => {
    bind(pendingTransactionModuleTypes.PendingTransactionStorageService)
      .to(DefaultPendingTransactionStorageService)
      .inSingletonScope();

    bind(pendingTransactionModuleTypes.TrackBroadcastedTransactionUseCase).to(
      TrackBroadcastedTransactionUseCase,
    );

    bind(pendingTransactionModuleTypes.ConfirmPendingTransactionsUseCase).to(
      ConfirmPendingTransactionsUseCase,
    );

    bind(pendingTransactionModuleTypes.PendingTransactionController)
      .to(DefaultPendingTransactionController)
      .inSingletonScope();
  });
}
