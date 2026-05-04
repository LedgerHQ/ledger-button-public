import "../../../components/index.js";

import { consume } from "@lit/context";
import { html, LitElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import { type CoreContext, coreContext } from "../../../context/core-context.js";
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

  @consume({ context: coreContext, subscribe: true })
  @property({ attribute: false })
  public core!: CoreContext;

  private currencyController?: PreferenceCurrencyController;

  override willUpdate(changedProps: PropertyValues) {
    if (changedProps.has("core") && this.core && !this.currencyController) {
      this.currencyController = new PreferenceCurrencyController(this, this.core);
    }
  }

  override render() {
    return html`
      <div class="flex flex-col px-16">
        ${this.currencyController?.currencies.map(
          (code) => html`
            <button
              type="button"
              class="hover:bg-base-transparent-hover flex w-full cursor-pointer items-center rounded-md p-12 text-left transition duration-150 ease-in-out"
              @click=${() => this.currencyController?.selectCurrency(code)}
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
