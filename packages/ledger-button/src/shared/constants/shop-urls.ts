import {
  DEFAULT_LANGUAGE,
  type LangKey,
} from "../../context/constants/languages.js";

const LEDGER_SHOP_BASE_URL = "https://shop.ledger.com";

export type GetShopUrlOptions = {
  language: LangKey;
  page?: string;
  search?: string;
};

/**
 * Builds a localized shop.ledger.com URL.
 * Omit `page` for root URLs with query parameters only.
 */
export function getShopUrl({
  language,
  page,
  search = "",
}: GetShopUrlOptions): string {
  const query = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  const languageCode = language === DEFAULT_LANGUAGE ? "" : `/${language}`;

  if (!page) {
    return `${LEDGER_SHOP_BASE_URL}${languageCode}${query}`;
  }

  const normalizedPage = page.startsWith("pages/") ? page : `pages/${page}`;
  return `${LEDGER_SHOP_BASE_URL}${languageCode}/${normalizedPage}${query}`;
}

export function getReferralShopUrl(url: string, language: LangKey): string {
  const parsed = new URL(url);
  const page = parsed.pathname.startsWith("/pages/")
    ? parsed.pathname.slice("/pages/".length)
    : undefined;
  const search = parsed.search.slice(1);

  return getShopUrl({
    language,
    page,
    ...(search ? { search } : {}),
  });
}

export function getLedgerWalletDownloadUrl(language: LangKey): string {
  return getShopUrl({ language, page: "ledger-wallet-download" });
}

export function getLedgerNanoSUpgradeUrl(language: LangKey): string {
  return getShopUrl({
    language,
    page: "ledger-nano-s-upgrade-program",
    search: "utm_source=support",
  });
}
