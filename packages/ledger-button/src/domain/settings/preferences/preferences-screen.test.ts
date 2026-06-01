/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../components/index.js", () => ({}));

import type { Destination } from "../../../shared/routes.js";
import { PreferencesScreen } from "./preferences-screen.js";

function createMockNavigation() {
  return {
    navigateTo: vi.fn(),
  };
}

function createMockDestinations() {
  return {
    preferenceLanguage: {
      name: "preferenceLanguage",
      component: "preference-language-screen",
      canGoBack: true,
      toolbar: { title: "Language", canClose: true },
    } as Destination,
    preferenceCurrency: {
      name: "preferenceCurrency",
      component: "preference-currency-view",
      canGoBack: true,
      toolbar: { title: "Currency", canClose: true },
    } as Destination,
  };
}

function createMockLanguages(overrides?: { settings?: unknown }) {
  return {
    currentTranslation: {
      common: { loading: "Loading..." },
      settings: overrides?.settings ?? {
        preferences: {
          title: "Preferences",
          language: { title: "Language" },
          currency: { title: "Currency" },
        },
      },
    },
  };
}

function createMockCore() {
  return {
    getPreferredFiatCurrency: vi.fn().mockReturnValue("usd"),
  };
}

function createPreferencesScreen(
  overrides: {
    languages?: unknown;
    navigation?: unknown;
    destinations?: unknown;
    core?: unknown;
  } = {},
) {
  const el = new PreferencesScreen();
  el.navigation = (overrides.navigation ?? createMockNavigation()) as never;
  el.destinations = (overrides.destinations ??
    createMockDestinations()) as never;
  el.languages = (overrides.languages ?? createMockLanguages()) as never;
  el.core = (overrides.core ?? createMockCore()) as never;
  (el as unknown as { willUpdate(map: Map<string, unknown>): void }).willUpdate(
    new Map([["core", undefined]]),
  );
  return el;
}

describe("PreferencesScreen", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("rendering", () => {
    test("should render language and currency menu items", () => {
      const el = createPreferencesScreen();
      const rendered = el.render();

      expect(rendered).toBeDefined();
    });

    test("should use translation labels", () => {
      const el = createPreferencesScreen();
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain("Language");
      expect(renderedString).toContain("Currency");
    });
  });

  describe("navigation", () => {
    test("handleLanguageClick should navigate to language destination", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createPreferencesScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (
        el as unknown as { handleLanguageClick: () => void }
      ).handleLanguageClick();

      expect(mockNav.navigateTo).toHaveBeenCalledWith(
        mockDest.preferenceLanguage,
      );
    });

    test("handleCurrencyClick should navigate to currency destination", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createPreferencesScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (
        el as unknown as { handleCurrencyClick: () => void }
      ).handleCurrencyClick();

      expect(mockNav.navigateTo).toHaveBeenCalledWith(
        mockDest.preferenceCurrency,
      );
    });
  });
});
