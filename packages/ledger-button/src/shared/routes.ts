import "../domain/onboarding/select-device/select-device.js";
import "../domain/onboarding/ledger-sync/ledger-sync.js";
import "../domain/onboarding/retrieving-accounts/retrieving-accounts.js";
import "../domain/onboarding/select-account/select-account.js";

import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { coreContext } from "../context/core-context.js";
import { Translation } from "../context/language-context.js";

@customElement("lb-connect-device")
export class LBConnectDevice extends LitElement {
  static override styles = css`
    :host(.remove) {
      animation: outro 250ms ease-in-out;
    }

    h1 {
      color: red;
      animation: intro 250ms ease-in-out;
      transform-origin: left bottom;
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

    @keyframes outro {
      from {
        opacity: 1;
        transform: scale(1) translateY(0);
      }

      to {
        opacity: 0;
        transform: scale(0.95) translateY(32px);
      }
    }
  `;

  @consume({ context: coreContext })
  @property({ attribute: false })
  public coreContext!: LedgerButtonCore;

  override connectedCallback() {
    super.connectedCallback();
    this.coreContext.fetchAccounts().then((acc) => console.log(acc));
  }

  override render() {
    return html`<h1>Connect Device</h1>`;
  }
}

@customElement("ledger-button-404")
export class LedgerButton404 extends LitElement {
  static override styles = css`
    :host(.remove) {
      animation: outro 250ms ease-in-out;
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

    @keyframes outro {
      from {
        opacity: 1;
        transform: scale(1) translateY(0);
      }

      to {
        opacity: 0;
        transform: scale(0.95) translateY(32px);
      }
    }
  `;

  override render() {
    return html`<h1>404</h1>`;
  }
}

export type Destinations = ReturnType<typeof makeDestinations>;
export type Destination = Destinations[keyof Destinations];

// MOVE DESTINATIONS TO NAVIGATION
export const makeDestinations = (translation: Translation) => {
  const destinations = {
    home: {
      name: "home",
      component: "lb-home",
      canGoBack: false,
      toolbar: {
        title: "Home",
        showClose: true,
        showLogo: true,
      },
    },
    ledgerSync: {
      name: "ledger-sync",
      component: "ledger-sync-screen",
      canGoBack: true,
      toolbar: {
        title: translation.onboarding.ledgerSync.title,
        showClose: true,
        showLogo: true,
      },
    },
    fetchAccounts: {
      name: "retrieving-accounts",
      component: "retrieving-accounts-screen",
      canGoBack: false,
      toolbar: {
        title: translation.onboarding.retrievingAccounts.title,
        showClose: false,
        showLogo: true,
      },
    },
    selectAccount: {
      name: "select-account",
      component: "select-account-screen",
      canGoBack: false,
      toolbar: {
        title: translation.onboarding.selectAccount.title,
        showClose: true,
        showLogo: true,
      },
    },
    onboarding: {
      name: "onboarding",
      component: "select-device-screen",
      canGoBack: false,
      toolbar: {
        title: translation.onboarding.selectDevice.title,
        showClose: true,
        showLogo: true,
      },
    },
    notFound: {
      name: "not-found",
      component: "ledger-button-404",
      canGoBack: false,
      toolbar: {
        title: "404",
        showClose: true,
        showLogo: true,
      },
    },
  } as const;

  return destinations;
};
