/**
 * @vitest-environment jsdom
 */

import {
  beforeEach,
  describe,
  expect,
  type MockInstance,
  test,
  vi,
} from "vitest";

vi.mock("../../../components/index.js", () => ({}));

import {
  CONTACT_US_URL,
  SUPPORT_URL,
} from "../../../shared/constants/support-urls.js";
import { SupportScreen } from "./support-screen.js";

function createMockLanguages() {
  return {
    currentTranslation: {
      settings: {
        support: {
          title: "Help & Support",
          support: "Support",
          contactUs: "Contact us",
        },
      },
    },
  };
}

function createSupportScreen(
  overrides: Partial<Pick<SupportScreen, "languages">> = {},
) {
  const el = new SupportScreen();
  el.languages = overrides.languages ?? (createMockLanguages() as never);
  el.navigation = { navigateTo: vi.fn() } as never;
  el.destinations = {} as never;
  return el;
}

describe("SupportScreen", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let windowOpenSpy: MockInstance<(...args: any[]) => any>;

  beforeEach(() => {
    vi.clearAllMocks();
    windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    document.body.innerHTML = "";
  });

  describe("rendering", () => {
    test("should render support items", () => {
      const el = createSupportScreen();
      const rendered = el.render();

      expect(rendered).toBeDefined();
    });

    test("should use translation labels for support item", () => {
      const el = createSupportScreen();
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain("Support");
      expect(renderedString).toContain("Contact us");
    });

    test("should fallback to default labels when translations are missing", () => {
      const el = createSupportScreen({
        languages: {
          currentTranslation: {
            settings: {
              support: undefined,
            },
          },
        } as never,
      });

      const rendered = el.render();
      expect(rendered).toBeDefined();
    });
  });

  describe("renderSupportItem", () => {
    test("should render a button with headphone icon", () => {
      const el = createSupportScreen();
      const onClick = vi.fn();
      const result = (el as any).renderSupportItem(
        "headphone",
        "Support",
        onClick,
      );

      expect(result).toBeDefined();
    });

    test("should render a button with envelope icon", () => {
      const el = createSupportScreen();
      const onClick = vi.fn();
      const result = (el as any).renderSupportItem(
        "envelope",
        "Contact us",
        onClick,
      );

      expect(result).toBeDefined();
    });
  });

  describe("handleSupportClick", () => {
    test("should open support URL in a new tab", () => {
      const el = createSupportScreen();

      (el as any).handleSupportClick();

      expect(windowOpenSpy).toHaveBeenCalledWith(
        SUPPORT_URL,
        "_blank",
        "noopener,noreferrer",
      );
    });
  });

  describe("handleContactUsClick", () => {
    test("should open contact us URL in a new tab", () => {
      const el = createSupportScreen();

      (el as any).handleContactUsClick();

      expect(windowOpenSpy).toHaveBeenCalledWith(
        CONTACT_US_URL,
        "_blank",
        "noopener,noreferrer",
      );
    });
  });

  describe("external link security", () => {
    test("should use noopener and noreferrer for support link", () => {
      const el = createSupportScreen();

      (el as any).handleSupportClick();

      const callArgs = windowOpenSpy.mock.calls[0];
      expect(callArgs[2]).toContain("noopener");
      expect(callArgs[2]).toContain("noreferrer");
    });

    test("should use noopener and noreferrer for contact us link", () => {
      const el = createSupportScreen();

      (el as any).handleContactUsClick();

      const callArgs = windowOpenSpy.mock.calls[0];
      expect(callArgs[2]).toContain("noopener");
      expect(callArgs[2]).toContain("noreferrer");
    });

    test("should open links in _blank target", () => {
      const el = createSupportScreen();

      (el as any).handleSupportClick();
      expect(windowOpenSpy.mock.calls[0][1]).toBe("_blank");

      (el as any).handleContactUsClick();
      expect(windowOpenSpy.mock.calls[1][1]).toBe("_blank");
    });
  });
});
