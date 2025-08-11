import { ContainerModule } from "inversify";

import { DefaultLedgerSyncService } from "./service/DefaultLedgerSyncService.js";
import { ContainerOptions } from "../diTypes.js";
import { ledgerSyncModuleTypes } from "./ledgerSyncModuleTypes.js";

type LedgerSyncModuleOptions = Pick<ContainerOptions, "stub">;

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
