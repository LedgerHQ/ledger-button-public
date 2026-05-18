import "../../../components/index.js";

import { consume } from "@lit/context";
import { html, LitElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  type CoreContext,
  coreContext,
} from "../../../context/core-context.js";
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

  @property({ type: Object })
  navigation!: Navigation;

  private currencyController?: PreferenceCurrencyController;

  override willUpdate(changedProps: PropertyValues) {
    if (changedProps.has("core") && this.core && !this.currencyController) {
      this.currencyController = new PreferenceCurrencyController(
        this,
        this.core,
        this.navigation,
      );
    }
  }

  override render() {
    const controller = this.currencyController;
    const selected = controller?.currentCurrency;

    if (!controller) {
      return html`<div class="flex flex-col px-16"></div>`;
    }

    return html`
      <div class="flex flex-col px-16">
        ${controller.currencies.map(
          (currency) => html`
            <button
              type="button"
              class="bg-base-transparent hover:bg-base-transparent-hover flex h-64 w-full cursor-pointer items-center justify-between gap-16 rounded-md px-8 py-0 text-left transition duration-150 ease-in-out"
              aria-current=${currency.code === selected ? "true" : "false"}
              @click=${() => controller.selectCurrency(currency.code)}
            >
              <span class="body-2-semi-bold text-base">
                ${currency.name} - ${currency.code}</span
              >
              ${currency.code === selected
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
}

declare global {
  interface HTMLElementTagNameMap {
    "preference-currency-screen": PreferenceCurrencyScreen;
  }
}
