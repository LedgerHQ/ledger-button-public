import "../../../components/index.js";

import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { getLanguageDisplayName, languages } from "../../../i18n";
import { tailwindElement } from "../../../tailwind-element.js";

@customElement("preference-language-screen")
@tailwindElement()
export class PreferenceLanguageScreen extends LitElement {
  override render() {
    return html`
      <div class="flex flex-col px-16">
        ${languages.map(
          (language) => html`
            <button
              type="button"
              class="hover:bg-base-transparent-hover flex w-full cursor-pointer items-center rounded-md p-12 text-left transition duration-150 ease-in-out"
              @click=${() => {
                console.log(language.key);
              }}
            >
              <span class="body-2-semi-bold text-base"
                >${getLanguageDisplayName(language.key)}</span
              >
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
