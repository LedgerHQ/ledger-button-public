import { ContainerModule, Factory } from "inversify";

import { ConsoleLoggerSubscriber } from "./service/ConsoleLoggerSubscriber.js";
import { DefaultLoggerPublisher } from "./service/DefaultLoggerPublisher.js";
import { LoggerPublisher } from "./service/LoggerPublisher.js";
import { LoggerSubscriber } from "./service/LoggerSubscriber.js";
import { loggerModuleTypes } from "./loggerModuleTypes.js";

type LoggerModuleOptions = {
  stub?: boolean;
};

export function loggerModuleFactory({ stub }: LoggerModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind<LoggerSubscriber>(loggerModuleTypes.LoggerSubscriber).to(
      ConsoleLoggerSubscriber,
    );

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
