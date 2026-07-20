import { consume, createContext, provide } from "@lit/context";
import { html, LitElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  DEFAULT_LANGUAGE,
  DEFAULT_LOCALE,
  isLangKey,
  type LangKey,
  languages,
  type Translation,
} from "./constants/languages.js";
import { detectBrowserLanguage } from "./utils/language-utils.js";
import { type CoreContext, coreContext } from "./core-context.js";

// The SSOT for language & translations are the local values of the Language context.
// The user language preference is stored in the IndexedDB via the core context and retrieved on mount.
export class LanguageContext extends EventTarget {
  static readonly LANGUAGE_CHANGE = "languagechange";

  private _currentLanguage: LangKey = detectBrowserLanguage();

  core?: CoreContext;

  setCurrentLanguage(languageKey: LangKey, options?: { persist?: boolean }) {
    const hasChanged = this._currentLanguage !== languageKey;
    this._currentLanguage = languageKey;
    if (hasChanged) {
      this.dispatchEvent(new Event(LanguageContext.LANGUAGE_CHANGE));
    }
    const persist = options?.persist !== false;
    if (!persist || !this.core) {
      return;
    }
    void this.core.savePreferredLanguage(languageKey);
  }

  get currentLanguage(): LangKey {
    return this._currentLanguage;
  }

  getTranslation(languageKey: LangKey): Translation {
    const { translation } =
      languages.find((language) => language.key === languageKey) || {};

    return translation ?? this.getTranslation(DEFAULT_LANGUAGE);
  }

  get currentTranslation() {
    return this.getTranslation(this.currentLanguage);
  }

  get locale() {
    return (
      languages.find((language) => language.key === this.currentLanguage)
        ?.locale ?? DEFAULT_LOCALE
    );
  }
}

export const langContext = createContext<LanguageContext>(
  Symbol.for("language"),
);

@customElement("language-provider")
export class LanguageProvider extends LitElement {
  @provide({ context: langContext })
  public languages: LanguageContext = new LanguageContext();

  @consume({ context: coreContext, subscribe: true })
  @property({ attribute: false })
  public core?: CoreContext;

  override willUpdate(changedProps: PropertyValues) {
    if (changedProps.has("core") && this.core) {
      this.languages.core = this.core;
      void this.core.getPreferredLanguage().then((storedLanguageKey) => {
        if (storedLanguageKey && isLangKey(storedLanguageKey)) {
          this.languages.setCurrentLanguage(storedLanguageKey, {
            persist: false,
          });
        }
        this.requestUpdate("languages");
      });
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}
export {
  isLangKey,
  type LangKey,
  languages,
  type Translation,
} from "./constants/languages.js";
