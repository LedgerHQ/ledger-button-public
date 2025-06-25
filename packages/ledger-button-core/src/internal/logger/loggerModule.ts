import { ContainerModule, Factory } from "inversify";

import { LogLevel } from "./model/constant.js";
import { ConsoleLoggerSubscriber } from "./service/ConsoleLoggerSubscriber.js";
import { DefaultLoggerPublisher } from "./service/DefaultLoggerPublisher.js";
import { LoggerPublisher } from "./service/LoggerPublisher.js";
import { LoggerSubscriber } from "./service/LoggerSubscriber.js";
import { ContainerOptions } from "../di.js";
import { loggerModuleTypes } from "./loggerModuleTypes.js";

type LoggerModuleOptions = Pick<ContainerOptions, "stub" | "loggerLevel">;

export function loggerModuleFactory({
  stub,
  loggerLevel,
}: LoggerModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind<Factory<LoggerSubscriber>>(
      loggerModuleTypes.LoggerSubscriber
    ).toFactory((_context) => {
      return (level: LogLevel) => {
        return new ConsoleLoggerSubscriber(level);
      };
    });
    // NOTE: Can multibind here if we need other types of loggers (exporter, etc)

    bind<Factory<LoggerPublisher>>(loggerModuleTypes.LoggerPublisher).toFactory(
      (context) => {
        return (tag: string) => {
          const subscribersFactory = context.getAll<Factory<LoggerSubscriber>>(
            loggerModuleTypes.LoggerSubscriber
          );
          const subscribers = subscribersFactory.map((factory) =>
            factory(loggerLevel)
          );
          return new DefaultLoggerPublisher(subscribers, tag);
        };
      }
    );

    if (stub) {
      rebindSync(loggerModuleTypes.LoggerPublisher).toConstantValue({
        // TODO: Implement stub
      });

      rebindSync(loggerModuleTypes.LoggerSubscriber).toConstantValue({
        // TODO: Implement stub
      });
    }
  });
}
