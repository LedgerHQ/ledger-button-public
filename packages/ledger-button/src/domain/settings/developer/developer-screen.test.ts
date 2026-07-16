/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../components/index.js", () => ({}));

import type { Destination } from "../../../shared/routes.js";
import { DeveloperScreen } from "./developer-screen.js";

function createMockNavigation() {
  return {
    navigateTo: vi.fn(),
  };
}

function createMockDestinations() {
  return {
    featureFlags: {
      name: "featureFlags",
      component: "feature-flags-screen",
      canGoBack: true,
      toolbar: { title: "Feature flags", canClose: true },
    } as Destination,
  };
}

function createMockLanguages() {
  return {
    currentTranslation: {
      settings: {
        featureFlags: {
          title: "Feature flags",
        },
      },
    },
  };
}

function createDeveloperScreen(
  overrides: {
    navigation?: ReturnType<typeof createMockNavigation>;
    destinations?: ReturnType<typeof createMockDestinations>;
    languages?: ReturnType<typeof createMockLanguages>;
  } = {},
) {
  const el = new DeveloperScreen();
  el.navigation = (overrides.navigation ?? createMockNavigation()) as never;
  el.destinations = (overrides.destinations ??
    createMockDestinations()) as never;
  el.languages = (overrides.languages ?? createMockLanguages()) as never;
  el.coreContext = {} as never;
  return el;
}

describe("DeveloperScreen", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("rendering", () => {
    test("should render the feature flag entry", () => {
      const el = createDeveloperScreen();
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain("Feature flags");
    });
  });

  describe("navigation", () => {
    test("handleFeatureFlagsClick should navigate to feature flags destination", () => {
      const mockNav = createMockNavigation();
      const mockDest = createMockDestinations();
      const el = createDeveloperScreen({
        navigation: mockNav,
        destinations: mockDest,
      });

      (el as any).handleFeatureFlagsClick();

      expect(mockNav.navigateTo).toHaveBeenCalledWith(mockDest.featureFlags);
    });
  });
});
