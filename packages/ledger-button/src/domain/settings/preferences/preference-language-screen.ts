import "../../../components/index.js";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  langContext,
  type LangKey,
  LanguageContext,
  languages,
} from "../../../context/language-context.js";
import { getLanguageDisplayName } from "../../../context/utils/language-utils.js";
import { tailwindElement } from "../../../tailwind-element.js";

@customElement("preference-language-screen")
@tailwindElement()
export class PreferenceLanguageScreen extends LitElement {
  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  override render() {
    const selected = this.languageContext.currentLanguage;

    return html`
      <div class="w-400 w-full flex-col items-start px-16 py-0">
        ${languages.map(
          (language) => html`
            <button
              type="button"
              class="bg-base-transparent hover:bg-base-transparent-hover flex h-64 w-full cursor-pointer items-center justify-between gap-16 rounded-md px-8 py-0 text-left transition duration-150 ease-in-out"
              aria-current=${language.key === selected ? "true" : "false"}
              @click=${() => this.handleSelectLanguage(language.key)}
            >
              <span class="body-2-semi-bold text-base"
                >${getLanguageDisplayName(language.key)}</span
              >
              ${language.key === selected
                ? html`
                    <ledger-icon
                      type="checkmarkCircle"
                      size="medium"
                      fillColor="currentColor"
                    ></ledger-icon>
                  `
                : html`<span aria-hidden="true"></span>`}
            </button>
          `,
        )}
      </div>
    `;
  }

  private handleSelectLanguage(code: LangKey) {
    this.languageContext.setCurrentLanguage(code);
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "preference-language-screen": PreferenceLanguageScreen;
  }
}
