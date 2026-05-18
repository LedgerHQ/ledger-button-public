import { ReactiveController, ReactiveControllerHost } from "lit";

import { type CoreContext } from "../../../context/core-context.js";
import {
  type LangKey,
  LanguageContext,
  languages,
} from "../../../context/language-context.js";
import { getLanguageDisplayName } from "../../../context/utils/language-utils.js";
import { Navigation } from "../../../shared/navigation.js";

export type LanguageOption = {
  key: LangKey;
  displayName: string;
};

export class PreferenceLanguageController {
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly languageContext: LanguageContext,
    private readonly core: CoreContext,
    private readonly navigation: Navigation,
  ) {
    this.host.addController(this as ReactiveController);
  }

  private trackLanguageChanged(languageKey: LangKey): void {
    void this.core.trackLanguageChanged(languageKey);
  }

  selectLanguage(languageKey: LangKey): void {
    if (languageKey === this.languageContext.currentLanguage) {
      return;
    }
    this.languageContext.setCurrentLanguage(languageKey);
    this.trackLanguageChanged(languageKey);
    this.navigation.navigateBack();
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
