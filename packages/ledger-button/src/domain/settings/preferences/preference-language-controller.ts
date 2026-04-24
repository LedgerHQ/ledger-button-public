import { ReactiveController, ReactiveControllerHost } from "lit";

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
  ) {
    this.host.addController(this as ReactiveController);
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

  selectLanguage(code: LangKey) {
    this.languageContext.setCurrentLanguage(code);
    this.host.requestUpdate();
  }
}
