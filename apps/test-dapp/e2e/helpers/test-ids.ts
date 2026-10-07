/**
 * `data-testid` values set on the test dApp and on the Ledger Button UI.
 * Keep in sync with the attributes rendered by the components.
 */
export const LEDGER_PROVIDER_RDNS = "com.ledger.wallet.provider";
export const LEDGER_SOLANA_WALLET_NAME = "Ledger";

export const DAPP_TEST_IDS = {
  providerCard: (rdnsOrUuid: string) => `provider-card-${rdnsOrUuid}`,
  connectedAccount: "connected-account",
  mockServerConnected: "mock-server-connected",
  solanaWalletRow: (walletName: string) =>
    `wallet-row-${walletName.toLowerCase().replace(/\s+/g, "-")}`,
  connectedSolanaPublicKey: "connected-public-key",
} as const;

export const LEDGER_BUTTON_TEST_IDS = {
  welcomeContinue: "welcome-continue",
  consentAccept: "consent-accept",
  consentRefuse: "consent-refuse",
  mockConnectionItem: "mock-connection-item",
  accountCard: "account-card",
  connectionSuccessClose: "connection-success-close",
} as const;
