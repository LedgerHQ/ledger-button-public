import { inject, injectable } from "inversify";

import { configModuleTypes } from "@internal/config/di/configModuleTypes";
import { Config } from "@internal/config/model/config";

import { LOG_LEVELS, type LogLevel } from "../model/constant";
import { LogData } from "./LoggerPublisher";
import { LoggerSubscriber } from "./LoggerSubscriber";

const STYLE_BY_LEVEL: Record<LogLevel, string> = {
  [LOG_LEVELS.debug]: "color: darkcyan",
  [LOG_LEVELS.info]: "color: green",
  [LOG_LEVELS.warn]: "color: darkorange",
  [LOG_LEVELS.error]: "color: red",
  [LOG_LEVELS.fatal]: "color: white; background: red",
};

@injectable()
export class ConsoleLoggerSubscriber implements LoggerSubscriber {
  constructor(
    @inject(configModuleTypes.Config) private readonly config: Config,
  ) {}

  private canLog(level: number): boolean {
    return level <= this.config.logLevel;
  }

  private formatMessage(level: LogLevel, message: string): [string, string] {
    return [`%c${message}`, STYLE_BY_LEVEL[level]];
  }

  log(level: LogLevel, message: string, data: LogData): void | Promise<void> {
    if (!this.canLog(level)) {
      return;
    }

    const tag = `[${data.tag}]`;

    console.group(...this.formatMessage(level, `${tag}: ${data.timestamp}`));
    switch (level) {
      case LOG_LEVELS.debug:
        console.debug(...this.formatMessage(level, message), data.data);
        break;
      case LOG_LEVELS.info:
        console.info(...this.formatMessage(level, message), data.data);
        break;
      case LOG_LEVELS.warn:
        console.warn(...this.formatMessage(level, message), data.data);
        break;
      case LOG_LEVELS.error:
      case LOG_LEVELS.fatal:
        console.error(...this.formatMessage(level, message), data.data);
        break;
    }
    console.groupEnd();
  }
}
