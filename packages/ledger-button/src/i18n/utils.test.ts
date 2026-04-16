import { describe, expect, test } from "vitest";

import { type LangKey } from "./languages.js";
import { getLanguageDisplayName } from "./utils.js";

const expectedDisplayNames: readonly [LangKey, string][] = [
  ["ar", "العربية"],
  ["de", "Deutsch"],
  ["en", "English"],
  ["es", "Español"],
  ["fr", "Français"],
  ["ja", "日本語"],
  ["ko", "한국어"],
  ["pt", "Português"],
  ["ru", "Русский"],
  // For Thai language, the more formal display name could be "ภาษาไทย" (as in the designs)
  // but new Intl.DisplayNames("th", { type: "language" }).of("th") returns "ไทย" which is correct too.
  ["th", "ไทย"],
  ["tr", "Türkçe"],
  ["zh", "中文"],
];

describe("getLanguageDisplayName", () => {
  test.each(expectedDisplayNames)(
    "Should return the correct display name for %s",
    (code, expected) => {
      expect(getLanguageDisplayName(code)).toBe(expected);
    },
  );

  test("Should fallback to code if Intl.DisplayNames returns nothing", () => {
    const code = "XYZ" as LangKey;
    const name = getLanguageDisplayName(code);
    expect(name).toBe("Xyz");
  });
});
