import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CRYPTO_ICONS_BASE_URL,
  resetCryptoIconCachesForTesting,
  resolveIconUrl,
} from "./crypto-icon-mapping";

const INDEX_URL = `${CRYPTO_ICONS_BASE_URL}index.json`;
const COINGECKO_URL =
  "https://mapping-service.api.ledger.com/v1/coingecko/mapped-assets";

type FetchOutcome = { ok?: boolean; body?: unknown; reject?: boolean };

function jsonResponse(body: unknown, ok = true): Partial<Response> {
  return {
    ok,
    json: () => Promise.resolve(body),
  };
}

/**
 * Installs a `fetch` stub that dispatches by URL. Each handler is invoked at
 * most once per call and lets tests assert how many times each endpoint is hit.
 */
function stubFetch(handlers: {
  index?: FetchOutcome;
  coinGecko?: FetchOutcome;
}): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((input: string) => {
    const outcome = input === INDEX_URL ? handlers.index : handlers.coinGecko;

    if (!outcome) {
      return Promise.reject(new Error(`Unexpected fetch: ${input}`));
    }
    if (outcome.reject) {
      return Promise.reject(new Error("network error"));
    }

    return Promise.resolve(jsonResponse(outcome.body, outcome.ok ?? true));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const INDEX_FIXTURE = {
  ethereum: { icon: "ETH.png" },
  "ethereum/erc20/usd_coin": { icon: "USDC.png" },
};

const COINGECKO_FIXTURE = [
  {
    ledgerId: "solana/spl/zenrock_btc_9hx",
    data: { img: "https://proxycgassets.api.live.ledger.com/zenbtc.png" },
  },
  {
    ledgerId: "solana/spl/walletconnect_token_wctk5",
    data: { img: "https://proxycgassets.api.live.ledger.com/wct.png" },
  },
  // Missing img -> must be skipped while building the map.
  { ledgerId: "solana/spl/no_image", data: {} },
];

describe("resolveIconUrl", () => {
  beforeEach(() => {
    resetCryptoIconCachesForTesting();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns null for an empty ledgerId without fetching", async () => {
    const fetchMock = stubFetch({});

    await expect(resolveIconUrl("")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves from the Ledger index and does not hit CoinGecko", async () => {
    const fetchMock = stubFetch({ index: { body: INDEX_FIXTURE } });

    await expect(resolveIconUrl("ethereum")).resolves.toBe(
      `${CRYPTO_ICONS_BASE_URL}ETH.png`,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(INDEX_URL);
    expect(fetchMock).not.toHaveBeenCalledWith(COINGECKO_URL);
  });

  it("falls back to the CoinGecko image URL when missing from the index", async () => {
    stubFetch({
      index: { body: INDEX_FIXTURE },
      coinGecko: { body: COINGECKO_FIXTURE },
    });

    await expect(
      resolveIconUrl("solana/spl/zenrock_btc_9hx"),
    ).resolves.toBe("https://proxycgassets.api.live.ledger.com/zenbtc.png");
  });

  it("returns null when the ledgerId is in neither source", async () => {
    stubFetch({
      index: { body: INDEX_FIXTURE },
      coinGecko: { body: COINGECKO_FIXTURE },
    });

    await expect(resolveIconUrl("bitcoin/unknown/token")).resolves.toBeNull();
  });

  it("skips CoinGecko entries that have no image", async () => {
    stubFetch({
      index: { body: {} },
      coinGecko: { body: COINGECKO_FIXTURE },
    });

    await expect(resolveIconUrl("solana/spl/no_image")).resolves.toBeNull();
  });

  it("caches the resolution per ledgerId and does not re-fetch", async () => {
    const fetchMock = stubFetch({ index: { body: INDEX_FIXTURE } });

    await resolveIconUrl("ethereum");
    await resolveIconUrl("ethereum");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fetches each remote source at most once across multiple ledgerIds", async () => {
    const fetchMock = stubFetch({
      index: { body: INDEX_FIXTURE },
      coinGecko: { body: COINGECKO_FIXTURE },
    });

    await resolveIconUrl("solana/spl/zenrock_btc_9hx");
    await resolveIconUrl("solana/spl/walletconnect_token_wctk5");

    const indexCalls = fetchMock.mock.calls.filter(
      ([url]) => url === INDEX_URL,
    );
    const coinGeckoCalls = fetchMock.mock.calls.filter(
      ([url]) => url === COINGECKO_URL,
    );
    expect(indexCalls).toHaveLength(1);
    expect(coinGeckoCalls).toHaveLength(1);
  });

  it("falls through to CoinGecko when the index responds with a non-ok status", async () => {
    stubFetch({
      index: { ok: false, body: {} },
      coinGecko: { body: COINGECKO_FIXTURE },
    });

    await expect(
      resolveIconUrl("solana/spl/zenrock_btc_9hx"),
    ).resolves.toBe("https://proxycgassets.api.live.ledger.com/zenbtc.png");
  });

  it("falls through to CoinGecko when the index fetch rejects", async () => {
    stubFetch({
      index: { reject: true },
      coinGecko: { body: COINGECKO_FIXTURE },
    });

    await expect(
      resolveIconUrl("solana/spl/zenrock_btc_9hx"),
    ).resolves.toBe("https://proxycgassets.api.live.ledger.com/zenbtc.png");
  });

  it("returns null when the CoinGecko fetch rejects", async () => {
    stubFetch({
      index: { body: {} },
      coinGecko: { reject: true },
    });

    await expect(
      resolveIconUrl("solana/spl/zenrock_btc_9hx"),
    ).resolves.toBeNull();
  });
});
