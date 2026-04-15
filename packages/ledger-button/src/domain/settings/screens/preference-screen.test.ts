/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../components/index.js", () => ({}));

import { PreferenceScreen } from "./preference-screen.js";

function createMockLanguages(overrides?: {
  settings?: Record<string, unknown> | null;
  common?: { loading?: string };
}) {
  return {
    currentTranslation: {
      common: overrides?.common ?? { loading: "Loading…" },
      settings: overrides?.settings ?? {
        title: "Settings",
        preferences: {
          title: "Preferences",
          description: "Preference options will appear here.",
        },
      },
    },
  };
}

function createPreferenceScreen(
  overrides: Partial<Pick<PreferenceScreen, "languages">> = {},
) {
  const el = new PreferenceScreen();
  el.languages = overrides.languages ?? (createMockLanguages() as never);
  el.navigation = { navigateTo: vi.fn() } as never;
  el.destinations = {} as never;
  el.coreContext = {} as never;
  return el;
}

describe("PreferenceScreen", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("rendering", () => {
    test("should render when settings translations exist", () => {
      const el = createPreferenceScreen();
      const rendered = el.render();

      expect(rendered).toBeDefined();
    });

    test("should show preferences description when provided", () => {
      const el = createPreferenceScreen();
      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain("Preference options will appear here.");
    });

    test("should show loading when settings are missing", () => {
      const el = createPreferenceScreen({
        languages: {
          currentTranslation: {
            common: { loading: "Loading…" },
            settings: null,
          },
        } as never,
      });

      const rendered = el.render();
      const renderedString = JSON.stringify(rendered);

      expect(renderedString).toContain("Loading…");
    });
  });
});
