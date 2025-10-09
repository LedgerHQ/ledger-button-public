import "../../components/index.js";
import "../onboarding/ledger-sync/ledger-sync";

import {
  type SignedResults,
  type SignPersonalMessageParams,
  type SignRawTransactionParams,
  type SignTransactionParams,
  type SignTypedMessageParams,
} from "@ledgerhq/ledger-button-core";
import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { AnimationKey } from "../../components/index.js";
import { type StatusType } from "../../components/organism/status/ledger-status.js";
import { CoreContext, coreContext } from "../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../context/language-context.js";
import { Navigation } from "../../shared/navigation.js";
import { Destinations } from "../../shared/routes.js";
import { tailwindElement } from "../../tailwind-element.js";
import { SignTransactionController } from "./sign-transaction-controller.js";

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

type Params = SignTransactionParams & {
  broadcast: boolean;
};

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

  @consume({ context: langContext })
  @property({ attribute: false })
  public languageContext!: LanguageContext;

  @property({ type: Object })
  transactionParams?:
    | SignTransactionParams
    | SignPersonalMessageParams
    | SignRawTransactionParams
    | SignTypedMessageParams;

  @property({ type: Object })
  params?: unknown;

  @property({ type: Boolean, attribute: false })
  broadcast = false;

  controller!: SignTransactionController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new SignTransactionController(
      this,
      this.coreContext,
      this.navigation,
      this.languageContext,
    );

    if (this.isParams(this.params)) {
      this.broadcast = this.params.broadcast;
    }

    const transactionParams =
      (this.params as Params) ??
      this.transactionParams ??
      this.coreContext.getPendingTransactionParams();

    if (!transactionParams) {
      this.controller.state.screen = "error";
      this.requestUpdate();
      return;
    }

    this.transactionParams = transactionParams;
    this.controller.startSigning(transactionParams);
  }

  private isParams(params: unknown): params is Params {
    return (
      typeof params === "object" &&
      params !== null &&
      "transaction" in params &&
      "broadcast" in params
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
        class="min-h-200 flex flex-col items-center justify-center gap-24 self-stretch px-24 pb-48"
      >
        <div class="w-208">
          <ledger-device-animation
            modelId=${deviceModel}
            animation=${deviceAnimation as AnimationKey}
          ></ledger-device-animation>
        </div>
        <div class="flex flex-col items-center gap-8 self-stretch">
          <p class="text-center body-1">${deviceTitle}</p>
          <p class="text-center text-muted body-2">${deviceDescription}</p>
        </div>
      </div>
    `;
  }

  private renderStatusState() {
    if (this.controller.state.screen === "signing") {
      return html``;
    }

    return html`
      <div
        class="flex min-h-0 flex-col items-stretch justify-center self-stretch p-24 pt-0"
      >
        <ledger-status
          type=${this.controller.state.screen}
          title=${this.controller.state.status.title}
          description=${this.controller.state.status.message}
          primary-button-label=${this.controller.state.status.cta1.label}
          secondary-button-label=${this.controller.state.status.cta2?.label ??
          ""}
          @status-action=${this.handleStatusAction}
        ></ledger-status>
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

  interface WindowEventMap {
    "ledger-internal-sign": CustomEvent<
      | { status: "success"; data: SignedResults }
      | { status: "error"; error: unknown }
    >;
  }
}
