import { ReactiveController, ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";
import {
  type LangKey,
  LanguageContext,
  languages,
} from "../../../context/language-context.js";
import { getLanguageDisplayName } from "../../../context/utils/language-utils.js";

export type LanguageOption = {
  key: LangKey;
  displayName: string;
};

export class PreferenceLanguageController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly languageContext: LanguageContext,
    private readonly core: CoreContext,
  ) {
    this.host.addController(this as ReactiveController);
  }

  trackLanguageChanged(languageKey: LangKey): void {
    void this.core.trackLanguageChanged(languageKey);
  }

  selectLanguage(code: LangKey): void {
    if (code === this.languageContext.currentLanguage) {
      return;
    }
    this.languageContext.setCurrentLanguage(code);
    this.trackLanguageChanged(code);
    this.host.requestUpdate();
  }

  get currentLanguage(): LangKey {
    return this.languageContext.currentLanguage;
  }

  get languageOptions(): LanguageOption[] {
    return languages.map((language) => ({
      key: language.key,
      displayName: getLanguageDisplayName(language.key),
    }));
  }
}
