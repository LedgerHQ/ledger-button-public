import type { WalletTransactionFeature } from "../../components/molecule/wallet-actions/ledger-wallet-actions.js";

/**
 * Deeplinks to open specific features in the Ledger Wallet desktop application.
 * Note: "sell" uses the "buy" deeplink as there's no dedicated sell deeplink.
 */
export const WALLET_ACTION_DEEPLINKS: Record<WalletTransactionFeature, string> =
  {
    send: "ledgerwallet://send",
    receive: "ledgerwallet://receive",
    swap: "ledgerwallet://swap",
    buy: "ledgerwallet://buy",
    earn: "ledgerwallet://earn",
    sell: "ledgerwallet://buy",
  };

/**
 * URL to download the Ledger Wallet desktop application.
 */
export const LEDGER_WALLET_DOWNLOAD_URL =
  "https://shop.ledger.com/pages/ledger-wallet-download";
