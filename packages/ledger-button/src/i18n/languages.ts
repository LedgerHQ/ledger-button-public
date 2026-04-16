import ar from "./ar.json" with { type: "json" };
import de from "./de.json" with { type: "json" };
import en from "./en.json" with { type: "json" };
import es from "./es.json" with { type: "json" };
import fr from "./fr.json" with { type: "json" };
import ja from "./ja.json" with { type: "json" };
import ko from "./ko.json" with { type: "json" };
import pt from "./pt.json" with { type: "json" };
import ru from "./ru.json" with { type: "json" };
import th from "./th.json" with { type: "json" };
import tr from "./tr.json" with { type: "json" };
import zh from "./zh.json" with { type: "json" };

export const languageKey = {
  ar,
  de,
  en,
  es,
  fr,
  ja,
  ko,
  pt,
  ru,
  th,
  tr,
  zh,
} as const;

const DEFAULT_LANGUAGE = "en";

export type LangKey = keyof typeof languageKey;

export type Translation = (typeof languageKey)[LangKey];

export type Language = {
  key: LangKey;
  name: string;
  translation: Translation;
};

export type Languages = readonly Language[];

export const languages: Languages = Object.freeze([
  {
    key: "en",
    name: "English",
    translation: en,
  },
  {
    key: "fr",
    name: "French",
    translation: fr,
  },
  {
    key: "de",
    name: "German",
    translation: de,
  },
  {
    key: "ru",
    name: "Russian",
    translation: ru,
  },
  {
    key: "es",
    name: "Spanish",
    translation: es,
  },
  {
    key: "ja",
    name: "Japanese",
    translation: ja,
  },
  {
    key: "tr",
    name: "Turkish",
    translation: tr,
  },
  {
    key: "ko",
    name: "Korean",
    translation: ko,
  },
  {
    key: "zh",
    name: "Chinese",
    translation: zh,
  },
  {
    key: "pt",
    name: "Portuguese",
    translation: pt,
  },
  {
    key: "ar",
    name: "Arabic",
    translation: ar,
  },
  // For thai language, the more formal display name could be "ภาษาไทย" (as in the designs)
  // but new Intl.DisplayNames("th", { type: "language" }).of("th") returns "ไทย" which is correct too.
  {
    key: "th",
    name: "Thai",
    translation: th,
  },
]);

export const getTranslation = (langKey: LangKey): Translation => {
  const { translation } =
    languages.find((language) => language.key === langKey) || {};

  return translation ?? getTranslation(DEFAULT_LANGUAGE);
};
