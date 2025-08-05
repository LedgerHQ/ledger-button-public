import "@ledgerhq/ledger-button-ui";
import "./shared/root-modal-component.js";

import {
  type AccountItemClickEventDetail,
  tailwindElement,
} from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import { langContext, LanguageContext } from "./context/language-context.js";
import { RootModalComponent } from "./shared/root-modal-component.js";
import { LedgerButtonAppController } from "./ledger-button-app-controller.js";

@customElement("ledger-button-app")
@tailwindElement()
export class LedgerButtonApp extends LitElement {
  @query("#navigation")
  root!: RootModalComponent;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  controller!: LedgerButtonAppController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new LedgerButtonAppController(
      this,
      this.languages.currentTranslation,
    );

    this.addEventListener("account-selected", this.handleAccountSelected);
    this.addEventListener(
      "ledger-button-disconnect",
      this.handleLedgerButtonDisconnect,
    );
    this.addEventListener("ledger-account-switch", this.handleAccountSwitch);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("account-selected", this.handleAccountSelected);
    this.removeEventListener(
      "ledger-button-disconnect",
      this.handleLedgerButtonDisconnect,
    );
    this.removeEventListener("ledger-account-switch", this.handleAccountSwitch);
  }

  private handleAccountSelected(e: CustomEvent<AccountItemClickEventDetail>) {
    this.controller.setLabel(e.detail.title);
  }

  private handleLedgerButtonDisconnect() {
    this.controller.setLabel(
      this.languages.currentTranslation.common.button.connect,
    );
    this.root.closeModal();
  }

  private handleAccountSwitch() {
    this.root.rootModalController.navigation.navigateTo(
      this.root.rootModalController.destinations.fetchAccounts,
    );
  }

  // renderRoute() {
  //   const route = routes.find(
  //     (r) => r.name === this.navigatorController.currentRoute,
  //   );

  //   if (route) {
  //     return html`${route.component}`;
  //   }

  //   return html`<ledger-button-404 id="not-found"></ledger-button-404>`;
  // }

  // renderBackButton() {
  //   const currentRoute = routes.find(
  //     (r) => r.name === this.navigatorController.currentRoute,
  //   );

  //   return this.navigatorController.canGoBack(currentRoute)
  //     ? html`<button @click=${() => this.navigatorController.navigateBack()}>
  //         Back
  //       </button>`
  //     : null;
  // }

  // navigateTo(route: string) {
  //   if (route === this.navigatorController.currentRoute) {
  //     return;
  //   }

  //   const currentRoute = this.navigatorController.currentRoute;
  //   // @ts-expect-error - shadowRoot is not typed
  //   const routeElement = this.shadowRoot?.querySelector(`#${currentRoute}`);
  //   if (routeElement) {
  //     routeElement.classList.add("remove");
  //   }

  //   setTimeout(() => {
  //     this.navigatorController.navigateTo(route);
  //   }, 250);
  // }

  openModal() {
    this.root.openModal();
  }

  override render() {
    return html`
      <div class="dark">
        <ledger-button
          label=${this.controller.label}
          variant="secondary"
          size="large"
          icon
          @ledger-button-click=${this.openModal}
        ></ledger-button>
        <root-modal-component id="navigation"></root-modal-component>
      </div>
    `;
  }
}
