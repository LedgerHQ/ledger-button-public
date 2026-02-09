import type { WalletTransactionFeature } from "../../components/molecule/wallet-actions/ledger-wallet-actions.js";

/**
 * Context for building deep links with pre-filled information.
 */
export type DeepLinkContext = {
  currency?: string;
  address?: string;
};

const BASE_URL = "ledgerwallet://";
/**
 * Base deep links for wallet actions.
 * Note: "sell" is not supported in Ledger Live Desktop, falls back to "buy".
 */
const BASE_DEEPLINKS: Record<WalletTransactionFeature, string> = {
  send: "send",
  receive: "receive",
  swap: "swap",
  buy: "buy",
  earn: "earn",
  sell: "buy",
};

/**
 * Builds a deep link for a wallet action with optional context for pre-filling information.
 *
 * Based on Ledger Live Desktop deep link documentation:
 * - send: ?currency={currency} (pre-fills currency selection)
 * - receive: ?currency={currency} (pre-fills currency selection)
 * - swap: ?fromToken={currency} (pre-fills source token)
 * - buy: no params (params passed through to liveApp)
 * - earn: ?cryptoAssetId={currency} (pre-fills asset for deposit)
 * - sell: not supported in Desktop, falls back to buy
 *
 * When partner is provided, appends tracking query params: deeplinkType, deeplinkDestination,
 * deeplinkChannel, deeplinkButtonPartner (for deeplink_clicked analytics).
 */
export function buildWalletActionDeepLink(
  action: WalletTransactionFeature,
  context?: DeepLinkContext,
  partner?: string,
): string {
  const route = BASE_DEEPLINKS[action];
  const baseUrl = `${BASE_URL}${route}`;

  let urlString: string;
  if (!context?.currency) {
    urlString = baseUrl;
  } else {
    switch (action) {
      case "send":
      case "receive":
        urlString = `${baseUrl}?currency=${context.currency}`;
        break;
      case "swap":
        urlString = `${baseUrl}?fromToken=${context.currency}`;
        break;
      case "earn":
        urlString = `${baseUrl}?cryptoAssetId=${context.currency}`;
        break;
      case "buy":
      case "sell":
      default:
        urlString = baseUrl;
    }
  }

  if (!partner) {
    return urlString;
  }

  const url = new URL(urlString);
  url.searchParams.set("deeplinkType", "Internal");
  url.searchParams.set("deeplinkDestination", route);
  url.searchParams.set("deeplinkChannel", "Button");
  url.searchParams.set("deeplinkButtonPartner", partner);
  return url.toString();
}

/**
 * URL to download the Ledger Wallet desktop application.
 */
export const LEDGER_WALLET_DOWNLOAD_URL =
  "https://shop.ledger.com/pages/ledger-wallet-download";
