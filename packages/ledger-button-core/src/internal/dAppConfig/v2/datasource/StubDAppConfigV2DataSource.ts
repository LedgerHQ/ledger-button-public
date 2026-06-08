import { inject, injectable } from "inversify";

import { configModuleTypes } from "../../../config/configModuleTypes.js";
import { Config } from "../../../config/model/config.js";
import { DAppConfigV2 } from "../model/dAppConfigV2Types.js";
import { DAppConfigV2DataSource } from "./DAppConfigV2DataSource.js";

const EVM_DEFAULT_NETWORKS = [
  {
    id: "1",
    currencyId: "ethereum",
    currencyName: "Ethereum",
    currencyTicker: "ETH",
  },
  {
    id: "42161",
    currencyId: "arbitrum",
    currencyName: "Arbitrum",
    currencyTicker: "ARB",
  },
  {
    id: "43114",
    currencyId: "avalanche_c_chain",
    currencyName: "Avalanche C-Chain",
    currencyTicker: "AVAX",
  },
  {
    id: "8453",
    currencyId: "base",
    currencyName: "Base",
    currencyTicker: "BASE",
  },
  {
    id: "56",
    currencyId: "bsc",
    currencyName: "Binance Smart Chain",
    currencyTicker: "BNB",
  },
  {
    id: "59144",
    currencyId: "linea",
    currencyName: "Linea",
    currencyTicker: "LINEA",
  },
  {
    id: "10",
    currencyId: "optimism",
    currencyName: "Optimism",
    currencyTicker: "OP",
  },
  {
    id: "137",
    currencyId: "polygon",
    currencyName: "Polygon",
    currencyTicker: "POL",
  },
  {
    id: "146",
    currencyId: "sonic",
    currencyName: "Sonic",
    currencyTicker: "SONIC",
  },
  {
    id: "324",
    currencyId: "zksync",
    currencyName: "ZKsync",
    currencyTicker: "ZK",
  },
  {
    id: "100",
    currencyId: "ethereum/erc20/gnosis",
    currencyName: "Gnosis",
    currencyTicker: "GNO",
  },
] as const;

const SOLANA_MAINNET_NETWORK = {
  id: "mainnet-beta",
  currencyId: "solana",
  currencyName: "Solana",
  currencyTicker: "SOL",
} as const;

const STUB_DAPP_CONFIGS_V2: Record<string, DAppConfigV2> = {
  ledger: {
    name: "Ledger",
    liveAppId: "ledger",
    domainUrl: "https://ledger.com",
    referralUrl: "https://shop.ledger.com/pages/hardware-wallets-comparison",
    blockchains: [
      {
        blockchain: "ethereum",
        appName: "Ethereum",
        networks: [...EVM_DEFAULT_NETWORKS],
        appDependencies: {
          appName: "Ethereum",
          dependencies: ["Ethereum"],
        },
      },
      {
        blockchain: "solana",
        appName: "Solana",
        networks: [SOLANA_MAINNET_NETWORK],
        appDependencies: {
          appName: "Solana",
          dependencies: ["Solana"],
        },
      },
    ],
    featureFlags: {},
  },
  "1inch": {
    name: "1inch",
    liveAppId: "1inch",
    domainUrl: "https://1inch.com",
    referralUrl:
      "https://shop.ledger.com/pages/hardware-wallets-comparison?utm_source=1inch&utm_medium=partner&utm_campaign=25-10-Ledger_Button-ALL-Traffic-Partnership&utm_content=msg_buy_ledger_button_1inch",
    blockchains: [
      {
        blockchain: "ethereum",
        appName: "1inch",
        networks: [...EVM_DEFAULT_NETWORKS],
        rpcMethods: {
          local: [
            "eth_sendTransaction",
            "eth_sign",
            "eth_signTransaction",
            "eth_signTypedData",
            "eth_signTypedData_v4",
          ],
          broadcasted: ["eth_transactionCount", "eth_call"],
        },
        appDependencies: {
          appName: "1inch",
          dependencies: ["1inch", "Ethereum"],
          minVersion: ">=1.0.0",
        },
      },
      {
        blockchain: "solana",
        appName: "1inch",
        networks: [SOLANA_MAINNET_NETWORK],
        appDependencies: {
          appName: "1inch",
          dependencies: ["1inch", "Solana"],
          minVersion: ">=1.0.0",
        },
      },
    ],
    featureFlags: {},
  },
  okx: {
    name: "OKX",
    liveAppId: "okx",
    domainUrl: "https://okx.com",
    referralUrl:
      "https://shop.ledger.com/pages/hardware-wallets-comparison?utm_source=okx&utm_medium=partner&utm_campaign=25-10-Ledger_Button-ALL-Traffic-Partnership&utm_content=msg_buy_ledger_button_okx",
    blockchains: [
      {
        blockchain: "ethereum",
        appName: "Ethereum",
        networks: [...EVM_DEFAULT_NETWORKS],
        appDependencies: {
          appName: "Ethereum",
          dependencies: ["Ethereum"],
        },
      },
    ],
    featureFlags: {},
  },
  velora: {
    name: "Velora",
    liveAppId: "velora",
    domainUrl: "https://velora.xyz",
    referralUrl:
      "https://shop.ledger.com/pages/hardware-wallets-comparison?utm_source=velora&utm_medium=partner&utm_campaign=26-02-Ledger_Button-ALL-Traffic-Partnership&utm_content=msg_buy_ledger_button_velora",
    blockchains: [
      {
        blockchain: "ethereum",
        appName: "Ethereum",
        networks: [...EVM_DEFAULT_NETWORKS],
        appDependencies: {
          appName: "Ethereum",
          dependencies: ["Ethereum"],
        },
      },
    ],
    featureFlags: {},
  },
};

@injectable()
export class StubDAppConfigV2DataSource implements DAppConfigV2DataSource {
  constructor(
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {}

  async getDAppConfig(): Promise<DAppConfigV2> {
    const dAppIdentifier = this.config.dAppIdentifier;
    const dAppConfigV2 = STUB_DAPP_CONFIGS_V2[dAppIdentifier];

    if (!dAppConfigV2) {
      throw new Error(
        `No stub dApp config V2 found for dAppIdentifier: ${dAppIdentifier}`,
      );
    }

    return dAppConfigV2;
  }
}
