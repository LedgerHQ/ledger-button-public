import { afterEach, describe, expect, test, vi } from "vitest";

import { languages } from "../constants/languages.js";
import { getLanguageDisplayName } from "./language-utils.js";

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
