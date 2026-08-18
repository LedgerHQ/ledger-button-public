import { afterEach, describe, expect, test, vi } from "vitest";

import { DEFAULT_LANGUAGE, languages } from "../constants/languages";
import {
  detectBrowserLanguage,
  getLanguageDisplayName,
} from "./language-utils";

const expectedDisplayNamesInCatalogOrder: readonly string[] = [
  "English",
  "Français",
  "Deutsch",
  "Русский",
  "Español",
  "日本語",
  "Türkçe",
  "한국어",
  "中文",
  "Português",
  "ไทย",
];

describe("detectBrowserLanguage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockNavigator(languages: string[], language: string) {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
    vi.spyOn(navigator, "language", "get").mockReturnValue(language);
  }

  test("returns the first supported language from navigator.languages", () => {
    mockNavigator(["fr-FR", "fr", "en-US", "en"], "en-US");

    expect(detectBrowserLanguage()).toBe("fr");
  });

  test("strips the region subtag before matching (e.g. 'de-DE' → 'de')", () => {
    mockNavigator(["de-DE"], "de-DE");

    expect(detectBrowserLanguage()).toBe("de");
  });

  test("falls back to navigator.language when navigator.languages has no match", () => {
    mockNavigator(["ar-SA"], "ja-JP");

    expect(detectBrowserLanguage()).toBe("ja");
  });

  test("returns DEFAULT_LANGUAGE when no candidate matches a supported language", () => {
    mockNavigator(["ar-SA", "ar"], "ar");

    expect(detectBrowserLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  test("is case-insensitive (e.g. 'FR' is treated as 'fr')", () => {
    mockNavigator(["FR"], "FR");

    expect(detectBrowserLanguage()).toBe("fr");
  });
});

describe("getLanguageDisplayName", () => {
  test("matches expected labels in `languages` catalog order", () => {
    const keys = languages.map((language) => language.key);
    const displayNames = keys.map((key) => getLanguageDisplayName(key));

    expect(displayNames).toEqual(expectedDisplayNamesInCatalogOrder);
  });

  describe("fallback", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("when Intl.DisplayNames.of returns undefined, capitalizes the code", () => {
      vi.spyOn(Intl, "DisplayNames").mockImplementation(
        () =>
          ({
            of: () => undefined,
          }) as unknown as Intl.DisplayNames,
      );

      expect(getLanguageDisplayName("fr")).toBe("Fr");
    });
  });
});
