import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { createContext, provide } from "@lit/context";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export const coreContext = createContext<LedgerButtonCore>(Symbol.for("core"));

@customElement("core-provider")
export class CoreProvider extends LitElement {
  @provide({ context: coreContext })
  @property({ attribute: false })
  public core: LedgerButtonCore = new LedgerButtonCore({ stub: true });

  override render() {
    return html`<slot></slot>`;
  }
}
