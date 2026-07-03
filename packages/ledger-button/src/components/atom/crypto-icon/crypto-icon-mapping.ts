export type CryptoIconMapping = Record<string, { icon: string }>;

export const CRYPTO_ICONS_BASE_URL = "https://crypto-icons.ledger.com/";

const INDEX_URL = `${CRYPTO_ICONS_BASE_URL}index.json`;
const COINGECKO_URL =
  "https://mapping-service.api.ledger.com/v1/coingecko/mapped-assets";

type CoinGeckoMapping = Record<string, string>;
type CoinGeckoRawAsset = { ledgerId: string; data?: { img?: string } };

let mappingPromise: Promise<CryptoIconMapping> | null = null;
let coinGeckoPromise: Promise<CoinGeckoMapping> | null = null;

const resolvedCache = new Map<string, string | null>();

/**
 * Fetches the live Ledger crypto-icons index once and shares the result across
 * every `<ledger-crypto-icon>` instance. On any failure it resolves to an empty
 * mapping so callers fall through to the next resolution tier.
 */
function getCryptoIconMapping(): Promise<CryptoIconMapping> {
  if (!mappingPromise) {
    mappingPromise = fetch(INDEX_URL)
      .then((res) => (res.ok ? (res.json() as Promise<CryptoIconMapping>) : {}))
      .catch(() => ({}));
  }

  return mappingPromise;
}

/**
 * Fetches Ledger's CoinGecko mapping service once and reshapes the array
 * payload into a `ledgerId -> image URL` map for O(1) lookups. The image URLs
 * are already absolute. On failure it resolves to an empty mapping.
 */
function getCoinGeckoMapping(): Promise<CoinGeckoMapping> {
  if (!coinGeckoPromise) {
    coinGeckoPromise = fetch(COINGECKO_URL)
      .then((res) =>
        res.ok ? (res.json() as Promise<CoinGeckoRawAsset[]>) : [],
      )
      .then((assets) => {
        const mapping: CoinGeckoMapping = {};
        for (const asset of assets) {
          if (asset.ledgerId && asset.data?.img) {
            mapping[asset.ledgerId] = asset.data.img;
          }
        }
        return mapping;
      })
      .catch(() => ({}));
  }

  return coinGeckoPromise;
}

/**
 * Resolves the icon URL for a `ledgerId`, mirroring Ledger Live's resolution
 * chain: the Ledger CDN index first, then the CoinGecko mapping as a fallback.
 * Returns `null` when neither source has a match, letting the component render
 * the letter placeholder. The CoinGecko mapping is only fetched lazily, when a
 * `ledgerId` misses the index. Results are cached per `ledgerId`.
 */
export async function resolveIconUrl(ledgerId: string): Promise<string | null> {
  if (!ledgerId) {
    return null;
  }

  if (resolvedCache.has(ledgerId)) {
    return resolvedCache.get(ledgerId) ?? null;
  }

  const index = await getCryptoIconMapping();
  const indexIcon = index[ledgerId]?.icon;
  if (indexIcon) {
    const url = `${CRYPTO_ICONS_BASE_URL}${indexIcon}`;
    resolvedCache.set(ledgerId, url);
    return url;
  }

  const coinGecko = await getCoinGeckoMapping();
  const coinGeckoUrl = coinGecko[ledgerId] ?? null;
  resolvedCache.set(ledgerId, coinGeckoUrl);
  return coinGeckoUrl;
}

/**
 * Clears the module-level mapping promises and per-`ledgerId` cache. Intended
 * for tests only, so each case starts from a clean slate.
 */
export function resetCryptoIconCachesForTesting(): void {
  mappingPromise = null;
  coinGeckoPromise = null;
  resolvedCache.clear();
}
