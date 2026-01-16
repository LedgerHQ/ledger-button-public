import "../../atom/button/ledger-button.js";
import "../../atom/icon/ledger-icon.js";

import { consume } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { animate } from "motion";

import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { ANIMATION_DELAY } from "../../../shared/navigation.js";
import { tailwindElement } from "../../../tailwind-element.js";
import type { AnimationInstance } from "../../atom/modal/animation-types.js";
import type { WalletTransactionFeature } from "../wallet-actions/ledger-wallet-actions.js";

export type WalletRedirectConfirmEventDetail = {
  action: WalletTransactionFeature;
  timestamp: number;
};

export type WalletRedirectCancelEventDetail = {
  action: WalletTransactionFeature;
  timestamp: number;
};

export interface LedgerWalletRedirectDrawerAttributes {
  action: WalletTransactionFeature;
}

const LEDGER_WALLET_DOWNLOAD_URL =
  "https://shop.ledger.com/pages/ledger-wallet-download";

@customElement("ledger-wallet-redirect-drawer")
@tailwindElement()
export class LedgerWalletRedirectDrawer extends LitElement {
  @property({ type: String })
  action: WalletTransactionFeature = "send";

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  @query(".drawer-backdrop")
  private backdropElement!: HTMLElement;

  @query(".drawer-container")
  private containerElement!: HTMLElement;

  private backdropAnimation: AnimationInstance | null = null;
  private containerAnimation: AnimationInstance | null = null;
  private isClosing = false;

  override firstUpdated() {
    this.animateOpen();
  }

  private animateOpen() {
    this.cancelAnimations();

    this.backdropAnimation = animate(
      this.backdropElement,
      { opacity: [0, 1] },
      { duration: ANIMATION_DELAY / 1000, ease: "easeOut" },
    );

    this.containerAnimation = animate(
      this.containerElement,
      { transform: ["translateY(100%)", "translateY(0)"] },
      { duration: ANIMATION_DELAY / 1000, ease: "easeOut" },
    );
  }

  private async animateClose(): Promise<void> {
    this.cancelAnimations();

    const animations: Promise<void>[] = [];

    animations.push(
      new Promise<void>((resolve) => {
        this.backdropAnimation = animate(
          this.backdropElement,
          { opacity: [1, 0] },
          {
            duration: ANIMATION_DELAY / 1000,
            ease: "easeOut",
            onComplete: () => resolve(),
          },
        );
      }),
    );

    animations.push(
      new Promise<void>((resolve) => {
        this.containerAnimation = animate(
          this.containerElement,
          { transform: ["translateY(0)", "translateY(100%)"] },
          {
            duration: ANIMATION_DELAY / 1000,
            ease: "easeOut",
            onComplete: () => resolve(),
          },
        );
      }),
    );

    await Promise.all(animations);
  }

  private cancelAnimations() {
    if (this.backdropAnimation) {
      this.backdropAnimation.cancel();
      this.backdropAnimation = null;
    }
    if (this.containerAnimation) {
      this.containerAnimation.cancel();
      this.containerAnimation = null;
    }
  }

  private handleConfirm() {
    this.dispatchEvent(
      new CustomEvent<WalletRedirectConfirmEventDetail>(
        "wallet-redirect-confirm",
        {
          bubbles: true,
          composed: true,
          detail: {
            action: this.action,
            timestamp: Date.now(),
          },
        },
      ),
    );
  }

  private async handleCancel() {
    if (this.isClosing) return;

    this.isClosing = true;
    await this.animateClose();

    this.dispatchEvent(
      new CustomEvent<WalletRedirectCancelEventDetail>(
        "wallet-redirect-cancel",
        {
          bubbles: true,
          composed: true,
          detail: {
            action: this.action,
            timestamp: Date.now(),
          },
        },
      ),
    );
  }

  private handleDownload() {
    window.open(LEDGER_WALLET_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
  }

  override render() {
    const translations = this.languages?.currentTranslation;
    const title =
      translations?.walletRedirect?.title ?? "Continue in Ledger Wallet";
    const description =
      translations?.walletRedirect?.description ??
      "You need the Ledger Wallet desktop app to complete this action.";
    const confirmLabel =
      translations?.walletRedirect?.confirm ?? "Open Ledger Wallet";
    const downloadLabel =
      translations?.walletRedirect?.download ?? "Download Ledger Wallet";

    return html`
      <div class="lb-z-50 lb-absolute lb-inset-0">
        <div
          class="drawer-backdrop lb-absolute lb-inset-0 lb-bg-canvas-overlay lb-opacity-60"
          @click=${this.handleCancel}
        ></div>
        <div
          class="drawer-container lb-rounded-t-3xl lb-absolute lb-bottom-0 lb-left-0 lb-right-0 lb-bg-canvas-sheet"
          style="transform: translateY(100%)"
        >
          <button
            class="lb-absolute lb-right-16 lb-top-16 lb-flex lb-cursor-pointer lb-items-center lb-justify-center lb-border-none lb-bg-transparent lb-p-8"
            @click=${this.handleCancel}
            aria-label="Close"
          >
            <ledger-icon
              type="close"
              size="small"
              fillColor="white"
            ></ledger-icon>
          </button>
          <div
            class="lb-flex lb-flex-col lb-items-center lb-gap-32 lb-p-24 lb-pt-32 lb-text-center"
          >
            <div
              class="lb-flex lb-h-64 lb-w-64 lb-items-center lb-justify-center lb-rounded-full lb-bg-muted"
            >
              <ledger-icon
                type="info"
                size="large"
                fillColor="white"
              ></ledger-icon>
            </div>

            <div class="lb-flex lb-flex-col lb-gap-12">
              <h3 class="lb-font-semibold lb-text-base lb-heading-4">
                ${title}
              </h3>
              <p class="lb-text-muted lb-opacity-60 lb-body-1">
                ${description}
              </p>
            </div>

            <div class="lb-flex lb-w-full lb-flex-col lb-gap-12">
              <ledger-button
                variant="primary"
                size="full"
                label=${confirmLabel}
                @click=${this.handleConfirm}
              ></ledger-button>
              <ledger-button
                variant="secondary"
                size="full"
                label=${downloadLabel}
                @click=${this.handleDownload}
              ></ledger-button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-wallet-redirect-drawer": LedgerWalletRedirectDrawer;
  }

  interface WindowEventMap {
    "wallet-redirect-confirm": CustomEvent<WalletRedirectConfirmEventDetail>;
    "wallet-redirect-cancel": CustomEvent<WalletRedirectCancelEventDetail>;
  }
}

export default LedgerWalletRedirectDrawer;
