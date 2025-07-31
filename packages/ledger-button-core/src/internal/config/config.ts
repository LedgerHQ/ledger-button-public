export interface Config {
  originToken: string;
  ethereum: {
    defaultDerivationPath: string;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
  };
}

export const config: Config = {
  originToken:
    "1e55ba3959f4543af24809d9066a2120bd2ac9246e626e26a1ff77eb109ca0e5",
  ethereum: {
    defaultDerivationPath: "44'/60'/0'/0/0",
  },
  logging: {
    level: "info",
  },
};

export const originToken = config.originToken;
export const defaultDerivationPath = config.ethereum.defaultDerivationPath;
export const logLevel = config.logging.level;
