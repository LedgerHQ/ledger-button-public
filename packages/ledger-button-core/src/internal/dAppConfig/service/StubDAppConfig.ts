import { DAppConfig } from "../dAppConfigTypes.js";

export const stubDAppConfig: DAppConfig = {
  // Based on 1inch supported networks: https://help.1inch.io/en/articles/5528619-how-to-use-different-networks-on-1inch
  supportedBlockchains: [
    {
      id: "1",
      currency_id: "ethereum",
      currency_name: "Ethereum",
      currency_ticker: "ETH",
    },
    {
      id: "2",
      currency_id: "arbitrum",
      currency_name: "Arbitrum",
      currency_ticker: "ARB",
    },
    {
      id: "3",
      currency_id: "avalanche_c_chain",
      currency_name: "Avalanche C-Chain",
      currency_ticker: "AVAX",
    },
    {
      id: "4",
      currency_id: "base",
      currency_name: "Base",
      currency_ticker: "BASE",
    },
    {
      id: "5",
      currency_id: "bsc",
      currency_name: "Binance Smart Chain",
      currency_ticker: "BNB",
    },
    {
      id: "6",
      currency_id: "linea",
      currency_name: "Linea",
      currency_ticker: "LINEA",
    },
    {
      id: "7",
      currency_id: "optimism",
      currency_name: "Optimism",
      currency_ticker: "OP",
    },
    {
      id: "8",
      currency_id: "polygon",
      currency_name: "Polygon",
      currency_ticker: "MATIC",
    },
    {
      id: "9",
      currency_id: "sonic",
      currency_name: "Sonic",
      currency_ticker: "SONIC",
    },
    {
      id: "10",
      currency_id: "zksync",
      currency_name: "ZKsync",
      currency_ticker: "ZK",
    },
    {
      id: "11",
      currency_id: "ethereum/erc20/gnosis", // NOTE: this is just a reminder, tokens won't show on Ledger Sync
      currency_name: "Gnosis",
      currency_ticker: "GNO",
    },
  ],
  referralUrl: "https://shop.ledger.com/pages/hardware-wallets-comparison",
  domainUrl: "https://app.1inch.io/",
  appDependencies: [
    {
      blockchain: "ethereum",
      appName: "Ethereum",
      dependencies: ["1inch", "Ethereum"],
    },
  ],
};
