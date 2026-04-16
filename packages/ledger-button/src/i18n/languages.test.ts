import { describe, expect, test } from "vitest";

import {
  getTranslation,
  type LangKey,
  languageKey,
} from "./languages.js";

const languageKeys = Object.keys(languageKey) as LangKey[];

describe("getTranslation", () => {
  test.each(languageKeys)(
    "returns the translation bundle for language %s",
    (code) => {
      expect(getTranslation(code)).toBe(languageKey[code]);
    },
  );

  test("falls back to English when the key is not in the language list", () => {
    expect(getTranslation("zz" as LangKey)).toBe(languageKey.en);
  });
});
