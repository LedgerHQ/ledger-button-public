import "./ledger-button-ui";

import { fixture, html } from "@open-wc/testing";
import { expect } from "vitest";

describe("LedgerButtonUI", () => {
  it("should create the component", async () => {
    const element = await fixture(html`<ledger-button-ui></ledger-button-ui>`);
    expect(element).toBeTruthy();
  });

  it("should render with default label", async () => {
    const element = await fixture(html`<ledger-button-ui></ledger-button-ui>`);
    const buttonElement = element.shadowRoot?.querySelector("button");
    expect(buttonElement?.textContent?.trim()).toContain("Connect Ledger");
  });

  it("should accept custom label", async () => {
    const element = await fixture(
      html`<ledger-button-ui label="Custom Button"></ledger-button-ui>`
    );

    document.body.appendChild(element);

    const buttonElement = element.shadowRoot?.querySelector("button");
    expect(buttonElement?.textContent?.trim()).toContain("Custom Button");

    document.body.removeChild(element);
  });

  it("should handle disabled state", async () => {
    const element = await fixture(
      html`<ledger-button-ui disabled></ledger-button-ui>`
    );

    const buttonElement = element.shadowRoot?.querySelector("button");
    expect(buttonElement?.disabled).toBe(true);
  });

  it("should dispatch click event when enabled", async () => {
    const element = await fixture(html`<ledger-button-ui></ledger-button-ui>`);

    let eventFired = false;
    element.addEventListener("ledger-button-click", () => {
      eventFired = true;
    });

    const buttonElement = element.shadowRoot?.querySelector("button");
    buttonElement?.click();

    expect(eventFired).toBe(true);
  });
});
