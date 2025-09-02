import { injectable } from "inversify";

import {
  LOG_LEVELS,
  type LogLevel,
  LogLevelKey,
} from "../../logger/model/constant.js";

export type Environment = "staging" | "production";

export type LKRPConfig = {
  cloudSyncUrl: string;
};

// TODO: Remove optional and default values
// Also remove ethereum key when ready
export type ConfigArgs = {
  originToken?: string;
  logLevel?: LogLevelKey;
  dAppIdentifier?: string;
  environment?: Environment;
};

@injectable()
export class Config {
  originToken: string;
  dAppIdentifier: string;
  logLevel: LogLevel;
  environment: Environment;
  lkrp: LKRPConfig;

  constructor({
    originToken = "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5",
    dAppIdentifier = "",
    logLevel = "info",
    environment = "production",
  }: ConfigArgs) {
    this.originToken = originToken;
    this.dAppIdentifier = dAppIdentifier;
    this.logLevel = LOG_LEVELS[logLevel];
    this.environment = environment;
    this.lkrp = {
      cloudSyncUrl: this.getCloudSyncUrl(environment),
    };
  }

  private getCloudSyncUrl(environment: Environment): string {
    return environment === "production"
      ? "https://cloud-sync-backend.api.aws.prod.ldg-tech.com"
      : "https://cloud-sync-backend.api.aws.stg.ldg-tech.com";
  }

  setLogLevel(logLevel: LogLevelKey) {
    this.logLevel = LOG_LEVELS[logLevel];
  }

  setEnvironment(environment: Environment) {
    this.environment = environment;
    this.lkrp = {
      cloudSyncUrl: this.getCloudSyncUrl(environment),
    };
  }
}
