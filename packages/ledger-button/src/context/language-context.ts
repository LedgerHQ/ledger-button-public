import { createContext, provide } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { getTranslation, type LangKey } from "../i18n";

export class LanguageContext {
  private _currentLanguage: LangKey = "en";

  setCurrentLanguage(lang: LangKey) {
    this._currentLanguage = lang;
  }

  get currentLanguage(): LangKey {
    return this._currentLanguage;
  }

  get currentTranslation() {
    return getTranslation(this._currentLanguage);
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

export type { LangKey, Languages, Translation } from "../i18n";
