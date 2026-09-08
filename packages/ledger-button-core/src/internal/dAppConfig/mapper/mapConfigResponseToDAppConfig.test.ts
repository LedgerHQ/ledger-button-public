import type { ConfigResponse } from "@internal/backend/types";

import {
  EVM_DEFAULT_RPC_METHODS,
  SOLANA_DEFAULT_RPC_METHODS,
} from "../defaults/defaultBlockchainRpcMethods";
import { mapConfigResponseToDAppConfig } from "./mapConfigResponseToDAppConfig";

const EVM_NETWORK: ConfigResponse["supportedBlockchains"][number] = {
  id: "1",
  currency_id: "ethereum",
  currency_name: "Ethereum",
  currency_ticker: "ETH",
};

const SOLANA_NETWORK: ConfigResponse["supportedBlockchains"][number] = {
  id: "mainnet-beta",
  currency_id: "solana",
  currency_name: "Solana",
  currency_ticker: "SOL",
};

describe("mapConfigResponseToDAppConfig", () => {
  it("maps an EVM-only response into a single ethereum blockchain config", () => {
    const response: ConfigResponse = {
      supportedBlockchains: [EVM_NETWORK],
      referralUrl: "https://shop.ledger.com",
      domainUrl: "https://1inch.com",
      appDependencies: [
        {
          blockchain: "ethereum",
          appName: "1inch",
          dependencies: ["1inch", "Ethereum"],
        },
      ],
    };

    const result = mapConfigResponseToDAppConfig(response, "1inch");

    expect(result).toEqual({
      name: "1inch",
      liveAppId: "1inch",
      domainUrl: "https://1inch.com",
      referralUrl: "https://shop.ledger.com",
      featureFlags: {},
      blockchains: [
        {
          blockchain: "ethereum",
          appName: "1inch",
          networks: [
            {
              id: "1",
              currencyId: "ethereum",
              currencyName: "Ethereum",
              currencyTicker: "ETH",
            },
          ],
          appDependencies: {
            appName: "1inch",
            dependencies: [{ name: "1inch" }, { name: "Ethereum" }],
          },
          rpcMethods: EVM_DEFAULT_RPC_METHODS,
        },
      ],
    });
  });

  it("groups EVM and Solana networks into separate blockchain configs", () => {
    const response: ConfigResponse = {
      supportedBlockchains: [EVM_NETWORK, SOLANA_NETWORK],
      referralUrl: "https://shop.ledger.com",
      domainUrl: "https://ledger.com",
      appDependencies: [
        {
          blockchain: "ethereum",
          appName: "Ethereum",
          dependencies: ["Ethereum"],
        },
        {
          blockchain: "solana",
          appName: "Solana",
          dependencies: ["Solana"],
        },
      ],
    };

    const result = mapConfigResponseToDAppConfig(response, "ledger");

    expect(result.blockchains).toHaveLength(2);
    expect(result.blockchains[0]).toMatchObject({
      blockchain: "ethereum",
      networks: [
        {
          id: "1",
          currencyId: "ethereum",
          currencyName: "Ethereum",
          currencyTicker: "ETH",
        },
      ],
      rpcMethods: EVM_DEFAULT_RPC_METHODS,
    });
    expect(result.blockchains[1]).toMatchObject({
      blockchain: "solana",
      networks: [
        {
          id: "mainnet-beta",
          currencyId: "solana",
          currencyName: "Solana",
          currencyTicker: "SOL",
        },
      ],
      rpcMethods: SOLANA_DEFAULT_RPC_METHODS,
    });
  });

  it("uses empty app dependencies when the API omits a blockchain entry", () => {
    const response: ConfigResponse = {
      supportedBlockchains: [EVM_NETWORK],
      referralUrl: "https://shop.ledger.com",
      domainUrl: "https://okx.com",
      appDependencies: [],
    };

    const result = mapConfigResponseToDAppConfig(response, "okx");

    expect(result.blockchains[0].appDependencies).toEqual({
      appName: "ethereum",
      dependencies: [],
    });
  });
});
