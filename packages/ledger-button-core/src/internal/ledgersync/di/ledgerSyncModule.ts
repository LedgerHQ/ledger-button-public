import { ContainerModule } from "inversify";

import { DefaultLedgerSyncService } from "../service/DefaultLedgerSyncService";
import { ledgerSyncModuleTypes } from "./ledgerSyncModuleTypes";

type LedgerSyncModuleOptions = {
  stub?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ledgerSyncModuleFactory({ stub }: LedgerSyncModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(ledgerSyncModuleTypes.LedgerSyncService)
      .to(DefaultLedgerSyncService)
      .inSingletonScope();

    /* if (stub) {
      rebindSync(ledgerSyncModuleTypes.LedgerSyncService).to(
        StubLedgerSyncService,
      );
    } */
  });
}
