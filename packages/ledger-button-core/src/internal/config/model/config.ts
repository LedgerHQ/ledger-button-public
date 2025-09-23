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
  originToken: string;
  logLevel?: LogLevelKey;
  dAppIdentifier: string;
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
    originToken,
    dAppIdentifier,
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

  //TODO remove environment params as it's already set in the constructor and use this.environment.
  private getCloudSyncUrl(environment: Environment): string {
    return environment === "production"
      ? "https://cloud-sync-backend.api.aws.prd.ldg-tech.com"
      : "https://cloud-sync-backend.api.aws.stg.ldg-tech.com";
  }

  setLogLevel(logLevel: LogLevelKey) {
    this.logLevel = LOG_LEVELS[logLevel];
  }

  getAlpacaUrl(environment: Environment): string {
    return environment === "production"
      ? "https://alpaca.api.aws.prd.ldg-tech.com"
      : "https://alpaca.api.aws.stg.ldg-tech.com";
  }

  getCalUrl(environment: Environment): string {
    return environment === "production"
      ? "https://crypto-assets-service.api.ledger.com"
      : "https://crypto-assets-service.api.ledger-test.com";
  }

  setEnvironment(environment: Environment) {
    this.environment = environment;
    this.lkrp = {
      cloudSyncUrl: this.getCloudSyncUrl(environment),
    };
  }
}
