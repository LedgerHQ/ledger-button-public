import { ContainerModule } from "inversify";

import { DefaultEventTrackingService } from "./service/DefaultEventTrackingService.js";
import { EventTrackingService } from "./service/EventTrackingService.js";
import { StubEventTrackingService } from "./service/StubEventTrackingService.js";
import { TrackLedgerSyncActivated } from "./usecase/TrackLedgerSyncActivated.js";
import { TrackLedgerSyncOpened } from "./usecase/TrackLedgerSyncOpened.js";
import { TrackOnboarding } from "./usecase/TrackOnboarding.js";
import { TrackOpenSession } from "./usecase/TrackOpenSession.js";
import { TrackTransactionCompleted } from "./usecase/TrackTransactionCompleted.js";
import { TrackTransactionStarted } from "./usecase/TrackTransactionStarted.js";
import { eventTrackingModuleTypes } from "./eventTrackingModuleTypes.js";

interface EventTrackingModuleFactoryOptions {
  stub?: boolean;
}

export const eventTrackingModuleFactory = ({
  stub = false,
}: EventTrackingModuleFactoryOptions = {}) => {
  return new ContainerModule(({ bind }) => {
    if (stub) {
      bind<EventTrackingService>(eventTrackingModuleTypes.EventTrackingService)
        .to(StubEventTrackingService)
        .inSingletonScope();

      return;
    }

    bind<EventTrackingService>(eventTrackingModuleTypes.EventTrackingService)
      .to(DefaultEventTrackingService)
      .inSingletonScope();

    bind<TrackOnboarding>(eventTrackingModuleTypes.TrackOnboarding).to(
      TrackOnboarding,
    );

    bind<TrackTransactionStarted>(
      eventTrackingModuleTypes.TrackTransactionStarted,
    ).to(TrackTransactionStarted);

    bind<TrackTransactionCompleted>(
      eventTrackingModuleTypes.TrackTransactionCompleted,
    ).to(TrackTransactionCompleted);

    bind<TrackLedgerSyncOpened>(
      eventTrackingModuleTypes.TrackLedgerSyncOpened,
    ).to(TrackLedgerSyncOpened);

    bind<TrackOpenSession>(eventTrackingModuleTypes.TrackOpenSession).to(
      TrackOpenSession,
    );

    bind<TrackLedgerSyncActivated>(
      eventTrackingModuleTypes.TrackLedgerSyncActivated,
    ).to(TrackLedgerSyncActivated);
  });
};
