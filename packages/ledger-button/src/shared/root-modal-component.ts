import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { LedgerModal } from "@ledgerhq/ledger-button-ui";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";

import { coreContext } from "../context/core-context.js";
import { RootModalController } from "./root-modal-controller.js";

@customElement("root-modal-component")
export class RootModalComponent extends LitElement {
  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: LedgerButtonCore;

  @property({ type: Boolean, reflect: true })
  isOpen = false;

  @query("#ledger-modal")
  private ledgerModal!: LedgerModal;

  rootModalController!: RootModalController;

  override connectedCallback() {
    super.connectedCallback();
    this.rootModalController = new RootModalController(this, this.coreContext);
    this.rootModalController.computeInitialState();
    // @ts-expect-error - not sure why addEventListener is not typed
    this.addEventListener("modal-closed", this.modalClosedListener);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // @ts-expect-error - not sure why removeEventListener is not typed
    this.removeEventListener("modal-closed", this.modalClosedListener);
  }

  openModal() {
    this.isOpen = true;
    // this.rootModalController.openModal();
  }

  private modalClosedListener() {
    this.isOpen = false;
  }

  private handleToolbarClose() {
    this.ledgerModal.handleToolbarClose();
    this.rootModalController.navigation.resetNavigation();
  }

  renderScreen() {
    const currentScreen = this.rootModalController.currentScreen;

    console.log("currentScreen", currentScreen?.component);

    const tag = unsafeStatic(currentScreen?.component ?? "ledger-button-404");

    if (currentScreen) {
      return staticHtml`<${tag} .navigation=${this.rootModalController.navigation}></${tag}>`;
    }

    return html`<ledger-button-404 id="not-found"></ledger-button-404>`;
  }

  override render() {
    return html`<ledger-modal id="ledger-modal" .isOpen=${this.isOpen}>
      <div slot="toolbar">
        <ledger-toolbar
          .title=${this.rootModalController.currentScreen?.toolbar.title ?? ""}
          .showClose=${this.rootModalController.currentScreen?.toolbar
            .showClose}
          .showLogo=${this.rootModalController.currentScreen?.toolbar.showLogo}
          @toolbar-close=${this.handleToolbarClose}
          aria-label=${this.rootModalController.currentScreen?.toolbar.title ??
          ""}
        >
          <ledger-icon name="arrow-left"></ledger-icon>
        </ledger-toolbar>
      </div>
      ${this.renderScreen()}
    </ledger-modal>`;
  }
}
