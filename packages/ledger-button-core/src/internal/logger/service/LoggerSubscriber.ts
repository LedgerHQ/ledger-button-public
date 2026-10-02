import { LogData } from "./LoggerPublisher";

export interface LoggerSubscriber {
  log(level: number, message: string, data: LogData): void;
}
