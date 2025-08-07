import "@ledgerhq/ledger-button-ui";
import "./context/core-context.js";
import "./context/language-context.js";
import "./ledger-button-app.js";

import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import { LedgerButtonApp } from "./ledger-button-app.js";

@customElement("ledger-button-playground")
export class LedgerButtonPlayground extends LitElement {
  @property({ type: String })
  demoMode: "onboarding" | "signTransaction" = "onboarding";

  @query("#app")
  private app!: HTMLDivElement;

  override connectedCallback() {
    super.connectedCallback();
  }

  override firstUpdated() {
    this.createApp();
  }

  createApp() {
    // NOTE: Example on how to inject the app in the DOM
    // we will probably want to have the provider in the component we want
    // to create so only one createElement is needed
    const core = document.createElement("core-provider");
    const language = document.createElement("language-provider");
    // NOTE: Casting here is necessary to have access to the full component api
    // eg: .openModal()
    const app = document.createElement("ledger-button-app") as LedgerButtonApp;
    core.appendChild(language);
    language.appendChild(app);
    this.app.appendChild(core);
  }

  override render() {
    return html`<div id="app"></div>`;
  }
}
