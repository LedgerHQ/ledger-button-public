/**
 * @vitest-environment jsdom
 */

import { BehaviorSubject } from "rxjs";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../components/index.js", () => ({}));

import PACKAGE from "../../../package.json" with { type: "json" };
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
    developer: {
      name: "developer",
      component: "developer-screen",
      canGoBack: true,
      toolbar: { title: "Developer", canClose: true },
    } as Destination,
    featureFlags: {
      name: "featureFlags",
      component: "feature-flags-screen",
      canGoBack: true,
      toolbar: { title: "Feature Flags", canClose: true },
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
        developer: {
          title: "Developer",
        },
        featureFlags: {
          title: "Feature Flags",
          solana: {
            title: "Solana",
          },
        },
      },
    },
  };
}

function createMockCore(overrides?: { hasDeveloperMode?: boolean }) {
  const contextSubject = new BehaviorSubject({
    hasDeveloperMode: overrides?.hasDeveloperMode ?? false,
  });

  return {
    hasDeveloperMode: vi
      .fn()
      .mockReturnValue(overrides?.hasDeveloperMode ?? false),
    enableDeveloperMode: vi.fn(),
    observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
    contextSubject,
  };
}

function createSettingsScreen(
  overrides: {
    languages?: unknown;
    navigation?: unknown;
    destinations?: unknown;
    coreContext?: ReturnType<typeof createMockCore>;
  } = {},
) {
  const el = new SettingsScreen();
  el.navigation = (overrides.navigation ?? createMockNavigation()) as never;
  el.destinations = (overrides.destinations ??
    createMockDestinations()) as never;
  el.languages = (overrides.languages ?? createMockLanguages()) as never;
  el.coreContext = (overrides.coreContext ?? createMockCore()) as never;
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

    test("should hide the developer entry when developer mode is disabled", () => {
      const el = createSettingsScreen();
      (el as any).hasDeveloperMode = false;
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).not.toContain("Developer");
    });

    test("should show the developer entry when developer mode is enabled", () => {
      const el = createSettingsScreen({
        coreContext: createMockCore({ hasDeveloperMode: true }),
      });
      (el as any).hasDeveloperMode = true;
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain("Developer");
    });

    test("should hide the feature flag entry from settings", () => {
      const el = createSettingsScreen({
        coreContext: createMockCore({ hasDeveloperMode: true }),
      });
      (el as any).hasDeveloperMode = true;
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).not.toContain("Feature Flags");
    });

    test("should render the package version footer", () => {
      const el = createSettingsScreen();
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain(PACKAGE.version);
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
      const result = (el as any).renderMenuItem("shield", "Security", onClick);

      expect(result).toBeDefined();
    });

    test("should render a disabled div when onClick is not provided", () => {
      const el = createSettingsScreen();
      const result = (el as any).renderMenuItem("shield", "Security");

      expect(result).toBeDefined();
    });

    test("should accept shield icon type", () => {
      const el = createSettingsScreen();
      const result = (el as any).renderMenuItem("shield", "Security", vi.fn());

      expect(result).toBeDefined();
    });

    test("should accept question icon type", () => {
      const el = createSettingsScreen();
      const result = (el as any).renderMenuItem("question", "Help", vi.fn());

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

  describe("developer mode unlock", () => {
    test("should enable developer mode after seven clicks on app version", () => {
      const mockCore = createMockCore();
      const el = createSettingsScreen({ coreContext: mockCore });

      for (let index = 0; index < 6; index += 1) {
        (el as any).handleVersionClick();
      }

      expect(mockCore.enableDeveloperMode).not.toHaveBeenCalled();

      (el as any).handleVersionClick();

      expect(mockCore.enableDeveloperMode).toHaveBeenCalledTimes(1);
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

    test("handleDeveloperClick should navigate to developer destination", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createSettingsScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (el as any).handleDeveloperClick();

      expect(mockNav.navigateTo).toHaveBeenCalledWith(mockDest.developer);
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

    test("should navigate to correct developer destination object", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createSettingsScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (el as any).handleDeveloperClick();

      const calledWith = mockNav.navigateTo.mock.calls[0][0] as Destination;
      expect(calledWith.name).toBe("developer");
      expect(calledWith.component).toBe("developer-screen");
    });
  });
});
