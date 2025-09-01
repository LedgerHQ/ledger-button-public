import { injectable } from "inversify";

import {
  LOG_LEVELS,
  type LogLevel,
  LogLevelKey,
} from "../../logger/model/constant.js";

// TODO: Remove optional and default values
export type ConfigArgs = {
  originToken?: string;
  ethereum?: {
    defaultDerivationPath: string;
  };
  logLevel?: LogLevelKey;
  dAppIdentifier?: string;
};

@injectable()
export class Config {
  originToken: string;
  dAppIdentifier: string;
  ethereum: {
    defaultDerivationPath: string;
  };
  logLevel: LogLevel;

  constructor({
    originToken = "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5",
    ethereum = {
      defaultDerivationPath: "44'/60'/0'/0/0",
    },
    dAppIdentifier = "",
    logLevel = "info",
  }: ConfigArgs) {
    this.originToken = originToken;
    this.ethereum = ethereum;
    this.dAppIdentifier = dAppIdentifier;
    this.logLevel = LOG_LEVELS[logLevel];
  }

  setLogLevel(logLevel: LogLevelKey) {
    this.logLevel = LOG_LEVELS[logLevel];
  }
}
