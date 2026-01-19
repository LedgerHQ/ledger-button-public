import {
  Account,
  type KnownDeviceDbModel,
} from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { html as staticHtml, unsafeStatic } from "lit/static-html.js";

import type { DeviceModelId } from "../components/atom/icon/device-icon/device-icon.js";
import {
  LedgerModal,
  ModalMode,
} from "../components/atom/modal/ledger-modal.js";
import type { WalletTransactionFeature } from "../components/molecule/wallet-actions/ledger-wallet-actions.js";
import { CoreContext, coreContext } from "../context/core-context.js";
import { langContext, LanguageContext } from "../context/language-context.js";
import { RootNavigationController } from "./root-navigation-controller.js";
import { Destination } from "./routes.js";

function mapDeviceModelId(dmkModelId?: string): DeviceModelId | undefined {
  if (!dmkModelId) {
    return undefined;
  }

  const modelMap: Record<string, DeviceModelId> = {
    NANO_X: "nanoX",
    NANO_S: "nanoS",
    NANO_SP: "nanoSP",
    STAX: "stax",
    FLEX: "flex",
    APEX: "apexp",
  };

  return modelMap[dmkModelId] ?? "flex";
}

@customElement("root-navigation-component")
export class RootNavigationComponent extends LitElement {
  @consume({ context: coreContext })
  public coreContext!: CoreContext;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @property({ type: Array })
  walletTransactionFeatures?: WalletTransactionFeature[];

  @query("#ledger-modal")
  private ledgerModal!: LedgerModal;

  @query("#modal-content")
  private modalContent!: HTMLElement;

  rootNavigationController!: RootNavigationController;

  isModalOpen = false;

  @state()
  private lastKnownDevice?: KnownDeviceDbModel;

  override connectedCallback() {
    super.connectedCallback();
    this.rootNavigationController = new RootNavigationController(
      this,
      this.coreContext,
      this.languageContext.currentTranslation,
      this.modalContent,
    );
    this.loadLastKnownDevice();
  }

  // PUBLIC METHODS
  public openModal(mode: ModalMode = "center") {
    this.ledgerModal.openModal(mode);
    this.isModalOpen = true;
  }

  public closeModal() {
    this.ledgerModal.closeModal();
    window.dispatchEvent(
      new CustomEvent("ledger-provider-close", {
        bubbles: true,
        composed: true,
      }),
    );
    this.isModalOpen = false;
  }

  public selectAccount(account: Account) {
    this.rootNavigationController.selectAccount(account);
  }

  public getSelectedAccount() {
    return this.rootNavigationController.selectedAccount;
  }

  public navigationIntent(
    intent: Destination["name"],
    params?: unknown,
    mode?: ModalMode,
  ) {
    this.rootNavigationController.navigationIntent(intent, params);
    this.openModal(mode ?? "center");
  }

  // PRIVATE METHODS
  private async loadLastKnownDevice() {
    try {
      const knownDevices = await this.coreContext.getKnownDevices();

      if (knownDevices.length > 0) {
        const sorted = [...knownDevices].sort(
          (a, b) => b.lastConnectedAt - a.lastConnectedAt,
        );
        this.lastKnownDevice = sorted[0];
      }
    } catch (error) {
      console.debug("Failed to load known devices for toolbar chip", error);
    }
  }

  private handleModalOpen() {
    this.loadLastKnownDevice();
    this.rootNavigationController.handleModalOpen();
    window.dispatchEvent(
      new CustomEvent("ledger-core-modal-open", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleModalClose() {
    window.dispatchEvent(
      new CustomEvent("ledger-provider-close", {
        bubbles: true,
        composed: true,
      }),
    );

    window.dispatchEvent(
      new CustomEvent("ledger-core-modal-close", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleModalAnimationComplete() {
    this.rootNavigationController.handleModalClose();
  }

  private handleChipClick(_e: CustomEvent) {
    this.rootNavigationController.handleChipClick();
  }

  private handleSettingsClick() {
    this.rootNavigationController.navigateToSettings();
  }

  private goBack() {
    this.rootNavigationController.navigateBack();
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
          .walletTransactionFeatures=${this.walletTransactionFeatures}
        ></${tag}>
      `;
    }

    return html`<ledger-button-404 id="not-found"></ledger-button-404>`;
  }

  override render() {
    const connectedDevice = this.coreContext.getConnectedDevice();
    const canGoBack =
      this.rootNavigationController.currentScreen?.canGoBack ?? false;

    const canClose =
      this.rootNavigationController.currentScreen?.toolbar.canClose ?? true;

    const isHomeFlow =
      this.rootNavigationController.currentScreen?.name === "home-flow";

    const displayDevice = connectedDevice ?? this.lastKnownDevice;

    const title =
      displayDevice && isHomeFlow
        ? displayDevice.name
        : this.rootNavigationController.currentScreen?.toolbar.title;

    const deviceModelId =
      displayDevice && isHomeFlow
        ? mapDeviceModelId(displayDevice.modelId)
        : undefined;

    const showSettings =
      this.rootNavigationController.currentScreen?.name === "home-flow";

    return html`
      <ledger-modal
        id="ledger-modal"
        @modal-opened=${this.handleModalOpen}
        @modal-closed=${this.handleModalClose}
        @modal-animation-complete=${this.handleModalAnimationComplete}
      >
        <div slot="toolbar">
          <ledger-toolbar
            title=${ifDefined(title)}
            aria-label=${ifDefined(title)}
            .canGoBack=${canGoBack}
            .canClose=${canClose}
            .showSettings=${showSettings}
            deviceModelId=${ifDefined(deviceModelId)}
            @ledger-toolbar-close=${this.closeModal}
            @ledger-toolbar-go-back-click=${this.goBack}
            @ledger-toolbar-chip-click=${this.handleChipClick}
            @ledger-toolbar-settings-click=${this.handleSettingsClick}
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

  interface WindowEventMap {
    "ledger-provider-close": CustomEvent;
    "ledger-core-modal-open": CustomEvent;
    "ledger-core-modal-close": CustomEvent;
  }
}
