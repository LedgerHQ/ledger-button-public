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

    it("should apply select-button variant classes", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          variant="select-button"
          label="Select Account"
        ></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("bg-transparent");
      expect(button?.className).toContain("border-gray-300");
    });

    it("should apply icon-only variant with proper sizing", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          variant="icon-only"
          size="medium"
          icon
        ></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("w-10");
      expect(button?.className).toContain("h-10");
      expect(button?.className).toContain("rounded-full");
    });

    it("should apply title-only variant classes", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          variant="title-only"
          label="Link Button"
        ></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("text-blue-600");
    });
  });

  describe("Sizes", () => {
    it("should apply small size classes", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          size="small"
          label="Small Button"
        ></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("px-3");
      expect(button?.className).toContain("py-2");
      expect(button?.className).toContain("text-sm");
    });

    it("should apply medium size classes", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          size="medium"
          label="Medium Button"
        ></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("px-4");
      expect(button?.className).toContain("py-2");
      expect(button?.className).toContain("text-base");
    });

    it("should apply large size classes", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          size="large"
          label="Large Button"
        ></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("px-6");
      expect(button?.className).toContain("py-3");
      expect(button?.className).toContain("text-lg");
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

  describe("Icon Functionality", () => {
    it("should render icon when enabled", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          icon
          label="With Icon"
          variant="icon-title"
        ></ledger-button-atom>`
      );

      const icon = element.shadowRoot?.querySelector(".icon");
      expect(icon).toBeTruthy();
    });

    it("should not render icon when disabled", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          label="Without Icon"
          variant="icon-title"
        ></ledger-button-atom>`
      );

      const icon = element.shadowRoot?.querySelector(".icon");
      expect(icon).toBeFalsy();
    });

    it("should position icon correctly", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          icon
          label="Icon Right"
          variant="icon-title"
          icon-position="right"
        ></ledger-button-atom>`
      );

      const content = element.shadowRoot?.querySelector(".flex.items-center");
      expect(content).toBeTruthy();
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

    it("should have focus-visible styles", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom></ledger-button-atom>`
      );

      const button = element.shadowRoot?.querySelector("button");
      expect(button?.className).toContain("focus:outline-none");
    });

    it("should set aria-hidden on icons", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom icon variant="icon-only"></ledger-button-atom>`
      );

      const icon = element.shadowRoot?.querySelector(".icon");
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("Content Rendering", () => {
    it("should render label for non-icon-only variants", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          label="Test Label"
          variant="primary"
        ></ledger-button-atom>`
      );

      const content = element.shadowRoot?.textContent;
      expect(content).toContain("Test Label");
    });

    it("should not render label for icon-only variant", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom
          label="Hidden Label"
          variant="icon-only"
          icon
        ></ledger-button-atom>`
      );

      const spans = element.shadowRoot?.querySelectorAll("span");
      const hasLabelText = Array.from(spans || []).some((span) =>
        span.textContent?.includes("Hidden Label")
      );
      expect(hasLabelText).toBe(false);
    });

    it("should handle empty states gracefully", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom></ledger-button-atom>`
      );

      expect(element.shadowRoot?.querySelector("button")).toBeTruthy();
    });
  });

  describe("Event Propagation", () => {
    it("should prevent default and stop propagation when disabled", async () => {
      const element = await fixture<LedgerButtonAtom>(
        html`<ledger-button-atom disabled></ledger-button-atom>`
      );

      let defaultPrevented = false;
      let propagationStopped = false;

      const mockEvent = {
        preventDefault: () => {
          defaultPrevented = true;
        },
        stopPropagation: () => {
          propagationStopped = true;
        },
      } as Event;

      element["_handleClick"](mockEvent);

      expect(defaultPrevented).toBe(true);
      expect(propagationStopped).toBe(true);
    });

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
