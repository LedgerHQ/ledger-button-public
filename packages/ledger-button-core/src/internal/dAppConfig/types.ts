export interface DAppConfig {
  supportedBlockchains: SupportedBlockchain[];
  referralUrl: string;
  domainUrl: string;
  appDependencies: AppDependency[];
}

type SupportedBlockchain = {
  id: string;
  currency_id: string;
  currency_name: string;
  currency_ticker: string;
};

type AppDependency = {
  blockchain: string;
  appName: string;
  dependencies: string[];
};
