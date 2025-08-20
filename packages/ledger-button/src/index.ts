import "./components/index.js";
import "./ledger-button-app.js";

import {
  type EIP6963ProviderInfo,
  LedgerButtonCore,
} from "@ledgerhq/ledger-button-core";
import { v4 as uuidv4 } from "uuid";

import { LedgerEIP1193Provider } from "./web3-provider/LedgerEIP1193Provider.js";
import { LedgerButtonApp } from "./ledger-button-app.js";

export type {
  EIP1193Provider,
  EIP6963ProviderDetail,
  EIP6963ProviderInfo,
} from "@ledgerhq/ledger-button-core";

export { LedgerEIP1193Provider };

let core: LedgerButtonCore | null = null;

export function initializeLedgerProvider({
  stub = false,
  stubWeb3Provider = false,
  stubDevice = false,
  target = document.body,
  dAppIndentifier = "",
  apiKey = "",
}: {
  stub?: boolean;
  stubDevice?: boolean;
  stubWeb3Provider?: boolean;
  target?: HTMLElement;
  dAppIndentifier?: string;
  apiKey?: string;
}): () => void {
  console.info({ apiKey, dAppIndentifier });

  // NOTE: `core` should be the same instance as the one injected in the lit app
  // so we either need to instanciate it here and give it to the lit app or retrieve it from it
  if (!core) {
    core = new LedgerButtonCore({
      stub,
      stubDevice,
      stubWeb3Provider,
    });
  }

  const info: EIP6963ProviderInfo = {
    uuid: uuidv4(),
    name: "Ledger Button",
    icon: "https://ledger.com/favicon.ico",
    rdns: "com.ledger.button",
  };

  const app = document.createElement("ledger-button-app") as LedgerButtonApp;
  app.core = core;

  if (target) {
    target.appendChild(app);
  } else {
    document.body.appendChild(app);
  }

  const provider = new LedgerEIP1193Provider(core, app);

  const announceProviderListener = () => {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: Object.freeze({ info, provider }),
      }),
    );
  };

  window.addEventListener("eip6963:requestProvider", announceProviderListener);

  window.dispatchEvent(
    new CustomEvent("eip6963:announceProvider", {
      detail: Object.freeze({ info, provider }),
    }),
  );

  // Cleanup function
  return () => {
    if (target) {
      target.removeChild(app);
    } else {
      document.body.removeChild(app);
    }
    window.removeEventListener(
      "eip6963:requestProvider",
      announceProviderListener,
    );
  };
}
