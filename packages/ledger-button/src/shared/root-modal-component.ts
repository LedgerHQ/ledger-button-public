import { LedgerModal } from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";

import { CoreContext, coreContext } from "../context/core-context.js";
import { langContext, LanguageContext } from "../context/language-context.js";
import { RootModalController } from "./root-modal-controller.js";

@customElement("root-modal-component")
export class RootModalComponent extends LitElement {
  @consume({ context: coreContext })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @query("#ledger-modal")
  private ledgerModal!: LedgerModal;

  rootModalController!: RootModalController;

  override connectedCallback() {
    super.connectedCallback();
    this.rootModalController = new RootModalController(
      this,
      this.coreContext,
      this.languageContext.currentTranslation,
    );
    this.rootModalController.computeInitialState();
  }

  public openModal() {
    this.ledgerModal.openModal();
  }

  public closeModal() {
    this.ledgerModal.closeModal();
  }

  private handleModalOpen() {
    this.rootModalController.handleModalOpen();
  }

  private handleModalClose() {
    this.rootModalController.handleModalClose();
  }

  selectAccount(address: string) {
    this.rootModalController.selectAccount(address);
    this.closeModal();
  }

  getSelectedAccount() {
    return this.rootModalController.selectedAccount;
  }

  renderScreen() {
    const currentScreen = this.rootModalController.currentScreen;

    const tag = unsafeStatic(currentScreen?.component ?? "ledger-button-404");

    if (currentScreen) {
      return staticHtml`
        <${tag}
          .destinations=${this.rootModalController.destinations}
          .navigation=${this.rootModalController.navigation}
        ></${tag}>
      `;
    }

    return html`<ledger-button-404 id="not-found"></ledger-button-404>`;
  }

  override render() {
    const connectedDevice = this.coreContext.getConnectedDevice();
    const title = connectedDevice
      ? connectedDevice.name
      : this.rootModalController.currentScreen?.toolbar.title;

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
            .showCloseButton=${this.rootModalController.currentScreen?.toolbar
              .showCloseButton}
            deviceModelId=${ifDefined(connectedDevice?.modelId)}
            @ledger-toolbar-close=${this.closeModal}
          >
          </ledger-toolbar>
        </div>
        ${this.renderScreen()}
      </ledger-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "root-modal-component": RootModalComponent;
  }
}
