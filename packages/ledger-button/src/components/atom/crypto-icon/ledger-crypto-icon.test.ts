/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./crypto-icon-mapping", () => ({
  resolveIconUrl: vi.fn(),
}));

import "./ledger-crypto-icon";

import { resolveIconUrl } from "./crypto-icon-mapping";
import { LedgerCryptoIcon } from "./ledger-crypto-icon";

const resolveIconUrlMock = vi.mocked(resolveIconUrl);

function mount(props: Partial<LedgerCryptoIcon> = {}): LedgerCryptoIcon {
  const el = document.createElement("ledger-crypto-icon") as LedgerCryptoIcon;
  Object.assign(el, props);
  document.body.appendChild(el);
  return el;
}

/** Lets the async `resolveIconUrl` promise settle and the element re-render. */
async function flush(el: LedgerCryptoIcon): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await el.updateComplete;
    await Promise.resolve();
  }
}

function image(el: LedgerCryptoIcon): HTMLImageElement | null {
  return el.shadowRoot?.querySelector("img") ?? null;
}

describe("ledger-crypto-icon", () => {
  beforeEach(() => {
    resolveIconUrlMock.mockReset();
    resolveIconUrlMock.mockResolvedValue(null);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the resolved icon URL as an <img>", async () => {
    const url = "https://crypto-icons.ledger.com/ETH.png";
    resolveIconUrlMock.mockResolvedValue(url);

    const el = mount({ ledgerId: "ethereum", ticker: "ETH" });
    await flush(el);

    expect(image(el)?.getAttribute("src")).toBe(url);
  });

  it("requests resolution for the provided ledgerId", async () => {
    const el = mount({ ledgerId: "ethereum/erc20/usd_coin", ticker: "USDC" });
    await flush(el);

    expect(resolveIconUrlMock).toHaveBeenCalledWith("ethereum/erc20/usd_coin");
  });

  it("shows the letter fallback (no <img>) when resolution returns null", async () => {
    resolveIconUrlMock.mockResolvedValue(null);

    const el = mount({ ledgerId: "solana/spl/unknown", ticker: "ZEN", alt: "Z" });
    await flush(el);

    expect(image(el)).toBeNull();
    expect(el.shadowRoot?.textContent).toContain("Z");
  });

  it("shows the letter fallback while resolution is still pending", async () => {
    resolveIconUrlMock.mockReturnValue(
      new Promise<string | null>(() => undefined),
    );

    const el = mount({ ledgerId: "ethereum", ticker: "ETH", alt: "E" });
    await flush(el);

    expect(image(el)).toBeNull();
    expect(el.shadowRoot?.textContent).toContain("E");
  });

  it("renders the fallback and does not resolve when no ledgerId is set", async () => {
    const el = mount({ ticker: "ETH", alt: "E" });
    await flush(el);

    expect(image(el)).toBeNull();
  });

  it("re-resolves and updates the icon when ledgerId changes", async () => {
    resolveIconUrlMock.mockResolvedValueOnce(
      "https://crypto-icons.ledger.com/ETH.png",
    );

    const el = mount({ ledgerId: "ethereum", ticker: "ETH" });
    await flush(el);
    expect(image(el)?.getAttribute("src")).toBe(
      "https://crypto-icons.ledger.com/ETH.png",
    );

    resolveIconUrlMock.mockResolvedValueOnce(
      "https://crypto-icons.ledger.com/USDC.png",
    );
    el.ledgerId = "ethereum/erc20/usd_coin";
    await flush(el);

    expect(resolveIconUrlMock).toHaveBeenLastCalledWith(
      "ethereum/erc20/usd_coin",
    );
    expect(image(el)?.getAttribute("src")).toBe(
      "https://crypto-icons.ledger.com/USDC.png",
    );
  });
});
