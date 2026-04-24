import "../../../components/index.js";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { tailwindElement } from "../../../tailwind-element.js";
import { PreferenceCurrencyController } from "./preference-currency-controller.js";

@customElement("preference-currency-screen")
@tailwindElement()
export class PreferenceCurrencyScreen extends LitElement {
  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  private currencyController = new PreferenceCurrencyController(this);

  override render() {
    return html`
      <div class="flex flex-col px-16">
        ${this.currencyController.currencies.map(
          (code) => html`
            <button
              type="button"
              class="hover:bg-base-transparent-hover flex w-full cursor-pointer items-center rounded-md p-12 text-left transition duration-150 ease-in-out"
              @click=${() => this.currencyController.selectCurrency(code)}
            >
              <span class="body-2-semi-bold text-base"
                >${code.toUpperCase()}</span
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
    "preference-currency-screen": PreferenceCurrencyScreen;
  }
}
