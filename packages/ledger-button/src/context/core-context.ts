import {
  LedgerButtonCore,
  SignTransactionParams,
} from "@ledgerhq/ledger-button-core";
import { createContext, provide } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export type CoreContext = LedgerButtonCore;

export const coreContext = createContext<CoreContext>(Symbol.for("core"));

@customElement("core-provider")
export class CoreProvider extends LitElement {
  @property({ type: Boolean, attribute: "stub" })
  stub = true;

  @property({ type: Boolean, attribute: "stub-device" })
  stubDevice = false;

  @provide({ context: coreContext })
  @property({ attribute: false })
  public core!: CoreContext;

  override connectedCallback() {
    super.connectedCallback();

    this.core = new LedgerButtonCore({
      stub: this.stub,
      stubDevice: this.stubDevice,
    });
  }

  override render() {
    return html`<slot></slot>`;
  }
}
