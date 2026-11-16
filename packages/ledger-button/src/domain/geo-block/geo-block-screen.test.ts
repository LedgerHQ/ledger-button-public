/**
 * @vitest-environment jsdom
 */

import { render } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../components/index", () => ({}));

import { SANCTIONS_COMPLIANCE_URL } from "../../shared/constants/support-urls";
import { GeoBlockScreen } from "./geo-block-screen";

const translation = {
  geoBlock: {
    title: "Location unavailable",
    description: "Ledger Wallet is not available in this location.",
    learnMore: "Learn more",
  },
};

function renderStatus(screen: GeoBlockScreen): HTMLElement {
  const container = document.createElement("div");
  render(screen.render(), container);
  return container.querySelector("ledger-status") as HTMLElement;
}

describe("GeoBlockScreen", () => {
  let screen: GeoBlockScreen;

  beforeEach(() => {
    screen = new GeoBlockScreen();
    screen.languages = {
      currentTranslation: translation,
    } as unknown as GeoBlockScreen["languages"];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("render", () => {
    it("should display the geo-block title and description", () => {
      const status = renderStatus(screen);

      expect(status.getAttribute("title")).toBe("Location unavailable");
      expect(status.getAttribute("description")).toBe(
        "Ledger Wallet is not available in this location.",
      );
    });

    it("should only offer the learn more action", () => {
      const status = renderStatus(screen);

      expect(status.getAttribute("primary-button-label")).toBe("Learn more");
      expect(status.getAttribute("secondary-button-label")).toBe("");
    });
  });

  describe("learn more action", () => {
    it("should open the sanctions article in a new tab", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const container = document.createElement("div");
      render(screen.render(), container);

      container
        .querySelector("ledger-status")
        ?.dispatchEvent(new CustomEvent("status-action"));

      expect(open).toHaveBeenCalledWith(
        SANCTIONS_COMPLIANCE_URL,
        "_blank",
        "noopener,noreferrer",
      );
    });
  });
});
