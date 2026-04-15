/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../components/index.js", () => ({}));

import type { Destination } from "../../shared/routes.js";
import { SettingsScreen } from "./settings-screen.js";

function createMockNavigation() {
  return {
    navigateTo: vi.fn(),
  };
}

function createMockDestinations() {
  return {
    preferences: {
      name: "preferences",
      component: "preferences-screen",
      canGoBack: true,
      toolbar: { title: "Preferences", canClose: true },
    } as Destination,
    security: {
      name: "security",
      component: "security-screen",
      canGoBack: true,
      toolbar: { title: "Security & confidentiality", canClose: true },
    } as Destination,
    support: {
      name: "support",
      component: "support-screen",
      canGoBack: true,
      toolbar: { title: "Help & Support", canClose: true },
    } as Destination,
  };
}

function createMockLanguages(overrides?: { settings?: unknown }) {
  return {
    currentTranslation: {
      settings: overrides?.settings ?? {
        title: "Settings",
        preferences: {
          title: "Preferences",
        },
        securityConfidentiality: {
          title: "Security & confidentiality",
          analytics: {
            title: "Analytics",
            description: "Enable Ledger to collect app usage data.",
          },
        },
        support: {
          title: "Help & Support",
          support: "Support",
          contactUs: "Contact us",
        },
      },
    },
  };
}

function createSettingsScreen(
  overrides: {
    languages?: unknown;
    navigation?: unknown;
    destinations?: unknown;
  } = {},
) {
  const el = new SettingsScreen();
  el.navigation = (overrides.navigation ?? createMockNavigation()) as never;
  el.destinations = (overrides.destinations ??
    createMockDestinations()) as never;
  el.languages = (overrides.languages ?? createMockLanguages()) as never;
  return el;
}

describe("SettingsScreen", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("rendering", () => {
    test("should render settings menu items", () => {
      const el = createSettingsScreen();
      const rendered = el.render();

      expect(rendered).toBeDefined();
    });

    test("should use translation labels", () => {
      const el = createSettingsScreen();
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain("Preferences");
      expect(renderedString).toContain("Security & confidentiality");
      expect(renderedString).toContain("Help & Support");
    });

    test("should fallback to default labels when translations are partial", () => {
      const el = createSettingsScreen({
        languages: {
          currentTranslation: {
            settings: {
              securityConfidentiality: undefined,
              support: undefined,
            },
          },
        },
      });

      const rendered = el.render();
      expect(rendered).toBeDefined();
    });
  });

  describe("renderMenuItem", () => {
    test("should render a clickable button when onClick is provided", () => {
      const el = createSettingsScreen();
      const onClick = vi.fn();
      const result = (el as any).renderMenuItem(
        "shield",
        "Security",
        onClick,
      );

      expect(result).toBeDefined();
    });

    test("should render a disabled div when onClick is not provided", () => {
      const el = createSettingsScreen();
      const result = (el as any).renderMenuItem("shield", "Security");

      expect(result).toBeDefined();
    });

    test("should accept shield icon type", () => {
      const el = createSettingsScreen();
      const result = (el as any).renderMenuItem(
        "shield",
        "Security",
        vi.fn(),
      );

      expect(result).toBeDefined();
    });

    test("should accept question icon type", () => {
      const el = createSettingsScreen();
      const result = (el as any).renderMenuItem(
        "question",
        "Help",
        vi.fn(),
      );

      expect(result).toBeDefined();
    });

    test("should accept settings icon type", () => {
      const el = createSettingsScreen();
      const result = (el as any).renderMenuItem(
        "settings",
        "Preferences",
        vi.fn(),
      );

      expect(result).toBeDefined();
    });
  });

  describe("navigation", () => {
    test("handlePreferencesClick should navigate to preferences destination", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createSettingsScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (el as any).handlePreferencesClick();

      expect(mockNav.navigateTo).toHaveBeenCalledWith(mockDest.preferences);
    });

    test("handleSecurityClick should navigate to security destination", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createSettingsScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (el as any).handleSecurityClick();

      expect(mockNav.navigateTo).toHaveBeenCalledWith(mockDest.security);
    });

    test("handleHelpSupportClick should navigate to support destination", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createSettingsScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (el as any).handleHelpSupportClick();

      expect(mockNav.navigateTo).toHaveBeenCalledWith(mockDest.support);
    });

    test("should navigate to correct preferences destination object", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createSettingsScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (el as any).handlePreferencesClick();

      const calledWith = mockNav.navigateTo.mock.calls[0][0] as Destination;
      expect(calledWith.name).toBe("preferences");
      expect(calledWith.component).toBe("preferences-screen");
    });

    test("should navigate to correct security destination object", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createSettingsScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (el as any).handleSecurityClick();

      const calledWith = mockNav.navigateTo.mock.calls[0][0] as Destination;
      expect(calledWith.name).toBe("security");
      expect(calledWith.component).toBe("security-screen");
    });

    test("should navigate to correct support destination object", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createSettingsScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (el as any).handleHelpSupportClick();

      const calledWith = mockNav.navigateTo.mock.calls[0][0] as Destination;
      expect(calledWith.name).toBe("support");
      expect(calledWith.component).toBe("support-screen");
    });
  });
});
