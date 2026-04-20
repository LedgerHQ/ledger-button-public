import { createContext, provide } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import {
  DEFAULT_LANGUAGE,
  type LangKey,
  languages,
  type Translation,
} from "./constants/languages.js";

export class LanguageContext {
  private _currentLanguage: LangKey = DEFAULT_LANGUAGE;

  setCurrentLanguage(lang: LangKey) {
    this._currentLanguage = lang;
  }

  get currentLanguage(): LangKey {
    return this._currentLanguage;
  }

  getTranslation(langKey: LangKey): Translation {
    const { translation } =
      languages.find((language) => language.key === langKey) || {};

    return translation ?? this.getTranslation(DEFAULT_LANGUAGE);
  }

  get currentTranslation() {
    return this.getTranslation(this.currentLanguage);
  }
}

export const langContext = createContext<LanguageContext>(
  Symbol.for("language"),
);

@customElement("language-provider")
export class LanguageProvider extends LitElement {
  @provide({ context: langContext })
  public languages: LanguageContext = new LanguageContext();

  override render() {
    return html`<slot></slot>`;
  }
}
export {
  type LangKey,
  languages,
  type Translation,
} from "./constants/languages.js";
