import { expect } from "vitest";

import "./ledger-button-ui";

describe("LedgerButtonUI", () => {
  it("should create the component", () => {
    const element = document.createElement("ledger-button-ui");
    expect(element).toBeTruthy();
  });

  it("should render with default label", async () => {
    const element = document.createElement("ledger-button-ui");
    document.body.appendChild(element);

    const buttonElement = element.shadowRoot?.querySelector("button");
    expect(buttonElement?.textContent?.trim()).toContain("Connect Ledger");

    document.body.removeChild(element);
  });

  it("should accept custom label", async () => {
    const element = document.createElement("ledger-button-ui");
    element.setAttribute("label", "Custom Button");
    document.body.appendChild(element);

    const buttonElement = element.shadowRoot?.querySelector("button");
    expect(buttonElement?.textContent?.trim()).toContain("Custom Button");

    document.body.removeChild(element);
  });

  it("should handle disabled state", async () => {
    const element = document.createElement("ledger-button-ui");
    element.setAttribute("disabled", "true");
    document.body.appendChild(element);

    const buttonElement = element.shadowRoot?.querySelector("button");
    expect(buttonElement?.disabled).toBe(true);

    document.body.removeChild(element);
  });

  it("should dispatch click event when not disabled", async () => {
    const element = document.createElement("ledger-button-ui");
    document.body.appendChild(element);

    let eventFired = false;
    element.addEventListener("ledger-button-click", () => {
      eventFired = true;
    });

    const buttonElement = element.shadowRoot?.querySelector("button");
    buttonElement?.click();

    expect(eventFired).toBe(true);

    document.body.removeChild(element);
  });
});
