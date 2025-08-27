import { DAppConfig } from "./types.js";

export const stubDAppConfig: DAppConfig = {
  supportedBlockchains: [
    {
      id: "1",
      currency_id: "ethereum",
      currency_name: "Ethereum",
      currency_ticker: "ETH",
    },
    {
      id: "4",
      currency_id: "matic",
      currency_name: "Polygon",
      currency_ticker: "MATIC",
    },
  ],
  referralUrl: "https://shop.ledger.com/pages/hardware-wallets-comparison",
  domainUrl: "https://app.1inch.io/",
  appDependencies: [
    {
      blockchain: "ethereum",
      appName: "1Inch",
      dependencies: ["1Inch", "Ethereum"],
    },
  ],
};
