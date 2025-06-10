import "./ledger-button-ui";

import { fixture, html } from "@open-wc/testing";
import { expect } from "vitest";

describe("LedgerButtonUI", () => {
  it("should create the component", async () => {
    const element = await fixture(html`<ledger-button-ui></ledger-button-ui>`);
    expect(element).toBeTruthy();
  });

  it("should render the button atom with correct configuration", async () => {
    const element = await fixture(html`<ledger-button-ui></ledger-button-ui>`);

    const buttonAtom = element.shadowRoot?.querySelector("ledger-button-atom");
    expect(buttonAtom).toBeTruthy();
    expect(buttonAtom?.getAttribute("label")).toBe("Connect Ledger");
    expect(buttonAtom?.getAttribute("variant")).toBe("primary");
    expect(buttonAtom?.getAttribute("size")).toBe("large");
    expect(buttonAtom?.hasAttribute("icon")).toBe(true);
  });

  it("should bubble events from the button atom", async () => {
    const element = await fixture(html`<ledger-button-ui></ledger-button-ui>`);

    let eventFired = false;
    element.addEventListener("ledger-button-click", () => {
      eventFired = true;
    });

    const buttonAtom = element.shadowRoot?.querySelector("ledger-button-atom");
    const button = buttonAtom?.shadowRoot?.querySelector("button");
    button?.click();

    expect(eventFired).toBe(true);
  });
});
