import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";

import { LedgerModal } from "../components/atom/modal/ledger-modal.js";
import { CoreContext, coreContext } from "../context/core-context.js";
import { langContext, LanguageContext } from "../context/language-context.js";
import { ANIMATION_DELAY } from "./navigation.js";
import { RootNavigationController } from "./root-navigation-controller.js";
import { Destination } from "./routes.js";

@customElement("root-navigation-component")
export class RootNavigationComponent extends LitElement {
  @consume({ context: coreContext })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @query("#ledger-modal")
  private ledgerModal!: LedgerModal;

  @query("#modal-content")
  private modalContent!: HTMLElement;

  rootNavigationController!: RootNavigationController;

  override connectedCallback() {
    super.connectedCallback();
    this.rootNavigationController = new RootNavigationController(
      this,
      this.coreContext,
      this.languageContext.currentTranslation,
      this.modalContent,
    );
  }

  // PUBLIC METHODS
  public openModal() {
    this.ledgerModal.openModal();
  }

  public closeModal() {
    this.ledgerModal.closeModal();
  }

  public selectAccount(address: string) {
    this.rootNavigationController.selectAccount(address);
    this.closeModal();
  }

  public getSelectedAccount() {
    return this.rootNavigationController.selectedAccount;
  }

  public navigationIntent(intent: Destination["name"], params?: unknown) {
    this.rootNavigationController.navigationIntent(intent, params);
    this.openModal();
  }

  // PRIVATE METHODS
  private handleModalOpen() {
    this.rootNavigationController.handleModalOpen();
  }

  private handleModalClose() {
    setTimeout(() => {
      this.rootNavigationController.handleModalClose();
      // NOTE: The 250ms delay here is to allow for animation to complete
      // Could be a CONSTANT if required
    }, ANIMATION_DELAY);
  }

  private handleChipClick(_e: CustomEvent) {
    this.rootNavigationController.handleChipClick();
  }

  private renderScreen() {
    const currentScreen = this.rootNavigationController.currentScreen;

    const tag = unsafeStatic(currentScreen?.component ?? "ledger-button-404");

    if (currentScreen) {
      return staticHtml`
        <${tag}
          .destinations=${this.rootNavigationController.destinations}
          .navigation=${this.rootNavigationController.navigation}
          .params=${this.rootNavigationController.params}
        ></${tag}>
      `;
    }

    return html`<ledger-button-404 id="not-found"></ledger-button-404>`;
  }

  override render() {
    const connectedDevice = this.coreContext.getConnectedDevice();
    const title =
      connectedDevice &&
      this.rootNavigationController.currentScreen?.name === "home"
        ? connectedDevice.name
        : this.rootNavigationController.currentScreen?.toolbar.title;

    const deviceModelId =
      connectedDevice &&
      this.rootNavigationController.currentScreen?.name === "home"
        ? connectedDevice.modelId
        : undefined;

    return html`
      <ledger-modal
        id="ledger-modal"
        @modal-opened=${this.handleModalOpen}
        @modal-closed=${this.handleModalClose}
      >
        <div slot="toolbar">
          <ledger-toolbar
            title=${ifDefined(title)}
            aria-label=${ifDefined(title)}
            .showCloseButton=${this.rootNavigationController.currentScreen
              ?.toolbar.showCloseButton}
            deviceModelId=${ifDefined(deviceModelId)}
            @ledger-toolbar-close=${this.closeModal}
            @ledger-toolbar-chip-click=${this.handleChipClick}
          >
          </ledger-toolbar>
        </div>
        <div id="modal-content">${this.renderScreen()}</div>
      </ledger-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "root-navigation-component": RootNavigationComponent;
  }
}
