import "@ledgerhq/ledger-button-ui";
import "./context/core-context.js";
import "./shared/root-modal-component.js";

import { html, LitElement } from "lit";
import { customElement, query } from "lit/decorators.js";

import { RootModalComponent } from "./shared/root-modal-component.js";

@customElement("ledger-button-playground")
export class LedgerButtonPlayground extends LitElement {
  @query("#navigation")
  navigation!: RootModalComponent;

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
    this.navigation.openModal();
  }

  override render() {
    return html`<core-provider>
      <ledger-button
        label="Connect Device"
        variant="primary"
        size="large"
        icon
        @ledger-button-click=${this.openModal}
      ></ledger-button>
      <root-modal-component id="navigation"> </root-modal-component>
    </core-provider>`;
  }
}
