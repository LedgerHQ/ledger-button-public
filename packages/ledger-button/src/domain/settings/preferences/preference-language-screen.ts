import "../../../components/index.js";

import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { LangKey, languages } from "../../../context/language-context.js";
import { tailwindElement } from "../../../tailwind-element.js";

@customElement("preference-language-screen")
@tailwindElement()
export class PreferenceLanguageScreen extends LitElement {
  private languageDisplayName(code: LangKey): string {
    try {
      return (
        new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code
      );
    } catch {
      return code;
    }
  }

  override render() {
    const ordered = (Object.keys(languages) as LangKey[]).sort();
    return html`
      <div class="flex flex-col px-16">
        ${ordered.map(
          (code) => html`
            <button
              type="button"
              class="hover:bg-base-transparent-hover flex w-full cursor-pointer items-center rounded-md p-12 text-left transition duration-150 ease-in-out"
              @click=${() => {
                console.log(code);
              }}
            >
              <span class="body-2-semi-bold text-base"
                >${this.languageDisplayName(code)}</span
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
