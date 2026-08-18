import "../../../components/index";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  type CoreContext,
  coreContext,
} from "../../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context";
import { Navigation } from "../../../shared/navigation";
import { tailwindElement } from "../../../tailwind-element";
import { PreferenceLanguageController } from "./preference-language-controller";

@customElement("preference-language-screen")
@tailwindElement()
export class PreferenceLanguageScreen extends LitElement {
  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @consume({ context: coreContext, subscribe: true })
  @property({ attribute: false })
  public core!: CoreContext;

  @property({ type: Object })
  navigation!: Navigation;

  private languageController?: PreferenceLanguageController;

  override willUpdate() {
    if (this.core && this.languageContext && !this.languageController) {
      this.languageController = new PreferenceLanguageController(
        this,
        this.languageContext,
        this.core,
        this.navigation,
      );
    }
  }

  override render() {
    const controller = this.languageController;
    if (!controller) {
      return html`<div class="flex flex-col px-16"></div>`;
    }

    const selected = controller.currentLanguage;

    return html`
      <div class="flex flex-col px-16">
        ${controller.languageOptions.map(
          (language) => html`
            <button
              type="button"
              class="bg-base-transparent hover:bg-base-transparent-hover flex h-64 w-full cursor-pointer items-center justify-between gap-16 rounded-md px-8 py-0 text-left transition duration-150 ease-in-out"
              aria-current=${language.key === selected ? "true" : "false"}
              @click=${() => controller.selectLanguage(language.key)}
            >
              <span class="body-2-semi-bold text-base"
                >${language.displayName}</span
              >
              ${language.key === selected
                ? html`
                    <ledger-icon
                      type="checkmarkCircle"
                      .size=${24}
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
}

declare global {
  interface HTMLElementTagNameMap {
    "preference-language-screen": PreferenceLanguageScreen;
  }
}
