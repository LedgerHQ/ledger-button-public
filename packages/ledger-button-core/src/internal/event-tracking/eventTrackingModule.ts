import { ContainerModule } from "inversify";

import { DefaultEventTrackingService } from "./DefaultEventTrackingService.js";
import { eventTrackingModuleTypes } from "./eventTrackingModuleTypes.js";
import { EventTrackingService } from "./EventTrackingService.js";
import { StubEventTrackingService } from "./StubEventTrackingService.js";

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
  });
};
