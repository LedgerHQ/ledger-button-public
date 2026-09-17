import "../../components/index";
import "../onboarding/ledger-sync/ledger-sync";

import { type SignNavigationIntent } from "@ledgerhq/ledger-wallet-provider-core";
import { consume } from "@lit/context";
import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

import { type ModalGradient } from "../../components/atom/modal/ledger-modal";
import { AnimationKey } from "../../components/index";
import { type StatusType } from "../../components/organism/status/ledger-status";
import { CoreContext, coreContext } from "../../context/core-context";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context";
import { Navigation } from "../../shared/navigation";
import { Destinations } from "../../shared/routes";
import { tailwindElement } from "../../tailwind-element";
import { SignTransactionController } from "./sign-transaction-controller";

const styles = css`
  :host {
    animation: intro 250ms ease-in-out;
    transform-origin: left bottom;
  }

  :host(.remove) {
    animation: intro 250ms ease-in-out reverse;
  }

  @keyframes intro {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(32px);
    }

    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

@customElement("sign-transaction-screen")
@tailwindElement(styles)
export class SignTransactionScreen extends LitElement {
  @property({ type: Object })
  navigation!: Navigation;

  @property({ type: Object })
  destinations!: Destinations;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: CoreContext;

  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @property({ type: Object })
  params?: unknown;

  controller!: SignTransactionController;

  private dispatchedGradient: ModalGradient | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SignTransactionController(
      this,
      this.coreContext,
      this.navigation,
      this.languageContext,
    );

    const intent = this.params as SignNavigationIntent | undefined;

    if (!intent) {
      this.controller.state.screen = "error";
      this.requestUpdate();
      return;
    }

    this.controller.startSigning(intent);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clearModalGradient();
  }

  override updated(_changedProperties: PropertyValues<this>) {
    this.syncModalGradient();
  }

  private syncModalGradient() {
    const screen = this.controller.state.screen;
    const nextGradient: ModalGradient | null =
      screen === "success" || screen === "error" ? screen : null;

    if (nextGradient === this.dispatchedGradient) {
      return;
    }

    if (nextGradient === null) {
      this.clearModalGradient();
      return;
    }

    this.dispatchedGradient = nextGradient;
    this.dispatchEvent(
      new CustomEvent("ledger-status-show", {
        bubbles: true,
        composed: true,
        detail: { type: nextGradient },
      }),
    );
  }

  private clearModalGradient() {
    if (this.dispatchedGradient === null) {
      return;
    }
    this.dispatchedGradient = null;
    this.dispatchEvent(
      new CustomEvent("ledger-status-hide", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderSigningState() {
    if (this.controller.state.screen !== "signing") {
      return html``;
    }

    const lang = this.languageContext.currentTranslation;
    const deviceModel = this.coreContext.getConnectedDevice()?.modelId;
    const deviceAnimation = this.controller.state.deviceAnimation;

    if (!deviceModel) return;

    const deviceTitle = lang.common.device.deviceActions[
      deviceAnimation as keyof typeof lang.common.device.deviceActions
    ].title.replace(
      "{device}",
      lang.common.device.model[
        deviceModel as keyof typeof lang.common.device.model
      ],
    );

    const deviceDescription =
      lang.common.device.deviceActions[
        deviceAnimation as keyof typeof lang.common.device.deviceActions
      ].description;

    return html`
      <div
        class="flex min-h-200 flex-col items-center justify-center gap-24 self-stretch px-24 pb-48"
      >
        <div class="w-208">
          <ledger-device-animation
            modelId=${deviceModel}
            animation=${deviceAnimation as AnimationKey}
          ></ledger-device-animation>
        </div>
        <div class="flex flex-col items-center gap-8 self-stretch">
          <p class="body-1 text-center">${deviceTitle}</p>
          <p class="text-muted body-2 text-center">${deviceDescription}</p>
        </div>
      </div>
    `;
  }

  private renderStatusState() {
    if (this.controller.state.screen === "signing") {
      return html``;
    }

    const broadcast =
      this.controller.state.screen === "success"
        ? this.controller.state.broadcast
        : undefined;

    const lang = this.languageContext.currentTranslation;
    const broadcastCopy = broadcast
      ? lang.signTransaction?.broadcast?.[broadcast.state]
      : undefined;

    return html`
      <div
        class="flex min-h-0 flex-col items-stretch justify-center self-stretch p-24 pt-0"
      >
        <ledger-status
          type=${this.controller.state.screen}
          title=${this.controller.state.status.title}
          description=${broadcast ? "" : this.controller.state.status.message}
          primary-button-label=${this.controller.state.status.cta1.label}
          secondary-button-label=${this.controller.state.status.cta2?.label ??
          ""}
          @status-action=${this.handleStatusAction}
        >
          ${broadcast && broadcastCopy
            ? html`
                <ledger-status-card
                  slot="card"
                  state=${broadcast.state}
                  title=${broadcastCopy.title}
                  description=${broadcastCopy.description}
                ></ledger-status-card>
              `
            : ""}
        </ledger-status>
      </div>
    `;
  }

  private handleStatusAction(
    event: CustomEvent<{
      timestamp: number;
      action: "primary" | "secondary";
      type: StatusType;
    }>,
  ) {
    if (this.controller.state.screen === "signing") {
      return;
    }

    const { action } = event.detail;

    if (action === "primary") {
      this.controller.state.status.cta1.action();
    } else if (action === "secondary") {
      this.controller.state.status.cta2?.action();
    }
  }

  override render() {
    switch (this.controller.state.screen) {
      case "success":
      case "error":
        return this.renderStatusState();
      case "signing":
      default:
        return this.renderSigningState();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sign-transaction-screen": SignTransactionScreen;
  }
}
