/**
 * @vitest-environment jsdom
 */

import { render } from "lit";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LedgerTransactionItem } from "./ledger-transaction-item.js";

const EXPLORER_URL =
  "https://etherscan.io/tx/0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd";

function renderItem(
  overrides: Partial<LedgerTransactionItem> = {},
): HTMLElement {
  const el = new LedgerTransactionItem();
  el.type = "received";
  el.title = "Ethereum";
  el.timestamp = "12:34";
  el.amount = "1.5";
  el.ticker = "ETH";
  el.fiatAmount = "3000";
  el.fiatCurrency = "USD";
  Object.assign(el, overrides);

  const container = document.createElement("div");
  render(el.render(), container);
  document.body.appendChild(container);
  return container;
}

describe("ledger-transaction-item", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("wraps the row in an anchor with target/rel/href when explorerUrl is set", () => {
    const container = renderItem({ explorerUrl: EXPLORER_URL });

    const anchor = container.querySelector("a");

    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute("href")).toBe(EXPLORER_URL);
    expect(anchor?.getAttribute("target")).toBe("_blank");
    expect(anchor?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders the explorer label and external-link icon (hidden by default, revealed on group hover/focus)", () => {
    const container = renderItem({
      explorerUrl: EXPLORER_URL,
      viewOnExplorerLabel: "View on explorer",
    });

    const labelHost = Array.from(
      container.querySelectorAll("div"),
    ).find((el) => el.textContent?.trim() === "View on explorer");

    expect(labelHost).toBeDefined();
    expect(labelHost?.className).toContain("hidden");
    expect(labelHost?.className).toContain("group-hover:flex");
    expect(labelHost?.className).toContain("group-focus-visible:flex");
    expect(labelHost?.querySelector("ledger-icon")).not.toBeNull();
  });

  it("does not render the explorer label when explorerUrl is missing", () => {
    const container = renderItem();

    const label = Array.from(container.querySelectorAll("div")).find(
      (el) => el.textContent?.trim() === "View on explorer",
    );

    expect(label).toBeUndefined();
  });

  it("renders a static container with no anchor when explorerUrl is missing", () => {
    const container = renderItem();

    expect(container.querySelector("a")).toBeNull();
  });

  it("does not render an anchor for non-http(s) URLs", () => {
    const container = renderItem({ explorerUrl: "javascript:alert(1)" });

    expect(container.querySelector("a")).toBeNull();
  });

  it("does not render an anchor when explorerUrl is malformed", () => {
    const container = renderItem({ explorerUrl: "not a url" });

    expect(container.querySelector("a")).toBeNull();
  });

  it("calls trackViewTransactionDetailsClicked with the hash when the anchor is clicked", () => {
    const trackViewTransactionDetailsClicked = vi.fn();
    const hash =
      "0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd";

    const container = renderItem({
      explorerUrl: EXPLORER_URL,
      hash,
      coreContext: { trackViewTransactionDetailsClicked },
    } as Partial<LedgerTransactionItem>);

    const anchor = container.querySelector("a");
    const clickEvent = new MouseEvent("click", { cancelable: true });
    anchor?.dispatchEvent(clickEvent);

    expect(trackViewTransactionDetailsClicked).toHaveBeenCalledTimes(1);
    expect(trackViewTransactionDetailsClicked).toHaveBeenCalledWith(hash);
    expect(clickEvent.defaultPrevented).toBe(false);
  });

  it("does not call tracking and does not throw when coreContext is missing", () => {
    const container = renderItem({
      explorerUrl: EXPLORER_URL,
      hash: "0xabc",
    } as Partial<LedgerTransactionItem>);

    const anchor = container.querySelector("a");

    expect(() => anchor?.click()).not.toThrow();
  });
});
