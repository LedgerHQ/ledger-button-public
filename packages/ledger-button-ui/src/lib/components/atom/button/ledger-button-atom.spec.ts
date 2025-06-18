import "./ledger-button-atom";

import { fixture, html } from "@open-wc/testing";
import { expect } from "vitest";

import { LedgerButtonAtom } from "./ledger-button-atom";

describe("LedgerButtonAtom", () => {
  it("should render with default props", async () => {
    const element = await fixture<LedgerButtonAtom>(
      html`<ledger-button-atom></ledger-button-atom>`
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
    const element = await fixture<LedgerButtonAtom>(
      html`<ledger-button-atom></ledger-button-atom>`
    );
    const button = element.shadowRoot?.querySelector("button");
    expect(button).toBeTruthy();
  });

  describe("Variants", () => {
    it("should apply primary variant classes", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          variant="primary"
          label="Primary Button"
        ></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("bg-black");
      expect(button?.className).toContain("text-white");
    });

    it("should apply secondary variant classes", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          variant="secondary"
          label="Secondary Button"
        ></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("bg-gray-100");
      expect(button?.className).toContain("text-gray-900");
    });
  });

  describe("Click Handling", () => {
    it("should emit custom event on click", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          label="Click Test"
          variant="primary"
        ></ledger-button-atom>`
      );

      let eventDetail: any = null;
      element.addEventListener("ledger-button-click", (e: any) => {
        eventDetail = e.detail;
      });

      const button = element.shadowRoot?.querySelector(
        "button"
      ) as HTMLButtonElement;
      button.click();

      expect(eventDetail).toBeTruthy();
      expect(eventDetail.variant).toBe("primary");
      expect(eventDetail.label).toBe("Click Test");
      expect(typeof eventDetail.timestamp).toBe("number");
    });

    it("should not emit event when disabled", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          disabled
          label="Disabled Button"
        ></ledger-button-atom>`
      );

      let eventEmitted = false;
      element.addEventListener("ledger-button-click", () => {
        eventEmitted = true;
      });

      const button = element.shadowRoot?.querySelector(
        "button"
      ) as HTMLButtonElement;
      button.click();

      expect(eventEmitted).toBe(false);
    });
  });

  describe("Disabled State", () => {
    it("should set disabled attribute on button", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom disabled></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.disabled).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("should use label as aria-label", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom label="Test Button"></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.getAttribute("aria-label")).toBe("Test Button");
    });

    it("should set appropriate type attribute", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom type="submit"></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.type).toBe("submit");
    });
  });

  describe("Content Rendering", () => {
    it("should render label", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          label="Test Label"
          variant="primary"
        ></ledger-button-atom>`
      );

      const content = element.shadowRoot?.textContent;
      expect(content).toContain("Test Label");
    });

    it("should handle empty states gracefully", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom></ledger-button-atom>`
      );

      expect(element.shadowRoot?.querySelector("button")).toBeTruthy();
    });
  });

  describe("Event Propagation", () => {
    it("should bubble custom events", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom label="Bubble Test"></ledger-button-atom>`
      );

      let bubbledEvent: Event | null = null;

      const eventHandler = (e: Event) => {
        bubbledEvent = e;
      };

      document.addEventListener("ledger-button-click", eventHandler);

      const button = element.shadowRoot?.querySelector(
        "button"
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
