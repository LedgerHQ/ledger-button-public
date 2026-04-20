import de from "../../i18n/de.json" with { type: "json" };
import en from "../../i18n/en.json" with { type: "json" };
import es from "../../i18n/es.json" with { type: "json" };
import fr from "../../i18n/fr.json" with { type: "json" };
import ja from "../../i18n/ja.json" with { type: "json" };
import ko from "../../i18n/ko.json" with { type: "json" };
import pt from "../../i18n/pt.json" with { type: "json" };
import ru from "../../i18n/ru.json" with { type: "json" };
import th from "../../i18n/th.json" with { type: "json" };
import tr from "../../i18n/tr.json" with { type: "json" };
import zh from "../../i18n/zh.json" with { type: "json" };

// Arabic is not supported yet (RTL issues)
export const languageKey = {
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

export const DEFAULT_LANGUAGE = "en";

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
    key: "th",
    name: "Thai",
    translation: th,
  },
]);
