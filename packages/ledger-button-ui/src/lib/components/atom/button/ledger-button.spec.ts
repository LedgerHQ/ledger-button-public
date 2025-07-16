import "./ledger-button";

import { fixture, html } from "@open-wc/testing";
import { expect } from "vitest";

import { LedgerButton } from "./ledger-button";

describe("LedgerButtonAtom", () => {
  it("should render with default props", async () => {
    const element = await fixture<LedgerButton>(
      html`<ledger-button></ledger-button>`,
    );

    expect(element).toBeTruthy();
    expect(element.variant).toBe("primary");
    expect(element.size).toBe("medium");
    expect(element.disabled).toBe(false);
    expect(element.icon).toBe(false);
    expect(element.label).toBe("");
    expect(element.type).toBe("button");
  });

  it("should render button element", async () => {
    const element = await fixture<LedgerButton>(
      html`<ledger-button></ledger-button>`,
    );
    const button = element.shadowRoot?.querySelector("button");
    expect(button).toBeTruthy();
  });

  describe("Variants", () => {
    it("should apply primary variant classes", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button
          variant="primary"
          label="Primary Button"
        ></ledger-button>`,
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("bg-interactive");
      expect(button?.className).toContain("text-on-interactive");
    });

    it("should apply secondary variant classes", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button
          variant="secondary"
          label="Secondary Button"
        ></ledger-button>`,
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("bg-muted");
      expect(button?.className).toContain("text-base");
    });
  });

  describe("Click Handling", () => {
    it("should emit custom event on click", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button
          label="Click Test"
          variant="primary"
        ></ledger-button>`,
      );

      let eventDetail: any = null;
      element.addEventListener("ledger-button-click", (e: any) => {
        eventDetail = e.detail;
      });

      const button = element.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;
      button.click();

      expect(eventDetail).toBeTruthy();
      expect(eventDetail.variant).toBe("primary");
      expect(eventDetail.label).toBe("Click Test");
      expect(typeof eventDetail.timestamp).toBe("number");
    });

    it("should not emit event when disabled", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button disabled label="Disabled Button"></ledger-button>`,
      );

      let eventEmitted = false;
      element.addEventListener("ledger-button-click", () => {
        eventEmitted = true;
      });

      const button = element.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;
      button.click();

      expect(eventEmitted).toBe(false);
    });
  });

  describe("Disabled State", () => {
    it("should set disabled attribute on button", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button disabled></ledger-button>`,
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.disabled).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("should use label as aria-label", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button label="Test Button"></ledger-button>`,
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.getAttribute("aria-label")).toBe("Test Button");
    });

    it("should set appropriate type attribute", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button type="submit"></ledger-button>`,
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.type).toBe("submit");
    });
  });

  describe("Content Rendering", () => {
    it("should render label", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button
          label="Test Label"
          variant="primary"
        ></ledger-button>`,
      );

      const content = element.shadowRoot?.textContent;
      expect(content).toContain("Test Label");
    });

    it("should handle empty states gracefully", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button></ledger-button>`,
      );

      expect(element.shadowRoot?.querySelector("button")).toBeTruthy();
    });
  });

  describe("Event Propagation", () => {
    it("should bubble custom events", async () => {
      const element = await fixture<LedgerButton>(
        html`<ledger-button label="Bubble Test"></ledger-button>`,
      );

      let bubbledEvent: Event | null = null;

      const eventHandler = (e: Event) => {
        bubbledEvent = e;
      };

      document.addEventListener("ledger-button-click", eventHandler);

      const button = element.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;
      button.click();

      expect(bubbledEvent).toBeTruthy();
      if (bubbledEvent) {
        expect((bubbledEvent as CustomEvent).bubbles).toBe(true);
      }

      document.removeEventListener("ledger-button-click", eventHandler);
    });
  });
});
