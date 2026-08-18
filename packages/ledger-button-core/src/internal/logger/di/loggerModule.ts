import { ContainerModule, Factory } from "inversify";

import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import type { Config } from "@internal/config/model/config";
import type { ErrorTrackingConfig } from "@internal/event-tracking/config/ErrorTrackingConfig";
import { eventTrackingModuleTypes } from "@internal/event-tracking/di/eventTrackingModuleTypes";
import type { EventTrackingService } from "@internal/event-tracking/service/EventTrackingService";

import { ConsoleLoggerSubscriber } from "../service/ConsoleLoggerSubscriber";
import { DefaultLoggerPublisher } from "../service/DefaultLoggerPublisher";
import { ErrorTrackingLoggerSubscriber } from "../service/ErrorTrackingLoggerSubscriber";
import { LoggerPublisher } from "../service/LoggerPublisher";
import { LoggerSubscriber } from "../service/LoggerSubscriber";
import { loggerModuleTypes } from "./loggerModuleTypes";

type LoggerModuleOptions = {
  stub?: boolean;
  errorTrackingConfig?: ErrorTrackingConfig;
};

export function loggerModuleFactory({
  stub,
  errorTrackingConfig,
}: LoggerModuleOptions = {}) {
  return new ContainerModule(({ bind }) => {
    bind<LoggerSubscriber>(loggerModuleTypes.LoggerSubscriber).to(
      ConsoleLoggerSubscriber,
    );

    if (errorTrackingConfig?.enabled !== false) {
      bind<LoggerSubscriber>(loggerModuleTypes.LoggerSubscriber)
        .toDynamicValue((context) => {
          // Use lazy resolution to avoid circular dependency:
          // EventTrackingService → Logger → ErrorTrackingLoggerSubscriber → EventTrackingService
          const getSessionId = () =>
            context
              .get<EventTrackingService>(
                eventTrackingModuleTypes.EventTrackingService,
              )
              .getSessionId();
          const getDAppId = () =>
            context.get<Config>(configModuleTypes.Config).dAppIdentifier;
          const trackEvent = (
            event: Parameters<EventTrackingService["trackEvent"]>[0],
          ) =>
            context
              .get<EventTrackingService>(
                eventTrackingModuleTypes.EventTrackingService,
              )
              .trackEvent(event);
          return new ErrorTrackingLoggerSubscriber({
            sessionId: getSessionId,
            dAppId: getDAppId,
            trackEvent,
            config: errorTrackingConfig,
          });
        })
        .inSingletonScope();
    }

    // NOTE: Can multibind here if we need other types of loggers (exporter, etc)
    bind<Factory<LoggerPublisher>>(loggerModuleTypes.LoggerPublisher).toFactory(
      (context) => {
        return (tag: string) => {
          const subscribers = context.getAll<LoggerSubscriber>(
            loggerModuleTypes.LoggerSubscriber,
          );
          return new DefaultLoggerPublisher(subscribers, tag);
        };
      },
    );

    if (stub) {
      // rebindSync(loggerModuleTypes.LoggerPublisher).toConstantValue({
      //   // TODO: Implement stub
      // });
      // rebindSync(loggerModuleTypes.LoggerSubscriber).toConstantValue({
      //   // TODO: Implement stub
      // });
    }
  });
}
