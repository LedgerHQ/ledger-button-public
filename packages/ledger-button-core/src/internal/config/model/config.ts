import { injectable } from "inversify";

import type { ClearSigningEndpoints } from "@api/blockchain-provider/model/types";
import {
  LOG_LEVELS,
  type LogLevel,
  LogLevelKey,
} from "@internal/logger/model/constant";

import PACKAGE from "../../../../package.json" with { type: "json" };

export type Environment = "staging" | "production" | "trial";

const CONNECT_GATEWAY_ORIGIN = "https://connect.api.prd.ledger.com";

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
  version: string;

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
      cloudSyncUrl: this.getCloudSyncUrl(),
    };
    this.version = PACKAGE.version;
  }

  private getCloudSyncUrl(): string {
    return this.hostForEnvironment(
      "https://cloud-sync-backend.api.aws.prd.ldg-tech.com",
      "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
    );
  }

  private hostForEnvironment(
    productionHost: string,
    stagingHost: string,
  ): string {
    switch (this.environment) {
      case "staging":
        return stagingHost;
      case "trial":
        return productionHost;
      case "production":
      default:
        return productionHost;
    }
  }

  setLogLevel(logLevel: LogLevelKey) {
    this.logLevel = LOG_LEVELS[logLevel];
  }

  getCoinServiceUrl(): string {
    return "https://coin-service.api.ledger.com";
  }

  getCalUrl(): string {
    return this.hostForEnvironment(
      "https://crypto-assets-service.api.ledger.com",
      "https://crypto-assets-service.api.ledger-test.com",
    );
  }

  getBackendUrl(): string {
    return this.hostForEnvironment(
      "https://ledgerb.api.ledger.com",
      "https://ledgerb.api.ledger-test.com",
    );
  }

  /**
   * Clear Signing and Transaction Check gateway for the trial environment.
   * Staging and production keep the context-module defaults.
   */
  getClearSigningEndpoints(): ClearSigningEndpoints | undefined {
    switch (this.environment) {
      case "trial":
        return {
          calUrl: `${CONNECT_GATEWAY_ORIGIN}/cal/v1`,
          transactionCheckUrl: `${CONNECT_GATEWAY_ORIGIN}/transaction-checks/v3`,
        };
      case "staging":
      case "production":
      default:
        return undefined;
    }
  }

  getCounterValueUrl(): string {
    return "https://countervalues.live.ledger.com";
  }

  getExplorerUrl(): string {
    return "https://explorers.api.live.ledger.com";
  }

  setEnvironment(environment: Environment) {
    this.environment = environment;
    this.lkrp = {
      cloudSyncUrl: this.getCloudSyncUrl(),
    };
  }
}
