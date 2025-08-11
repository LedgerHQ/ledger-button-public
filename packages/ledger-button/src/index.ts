import "@ledgerhq/ledger-button-ui";
import "./ledger-button-app.js";

import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { v4 as uuidv4 } from "uuid";

import { LedgerEIP1193Provider } from "./web3-provider/LedgerEIP1193Provider.js";
import { LedgerButtonApp } from "./ledger-button-app.js";

// NOTE: First draft only, args to be improved, name as well
// Probably needs improvement, but it could be the entry point of the library
export function initialize({
  stub = false,
  stubDevice = false,
  target = document.body,
}: {
  stub?: boolean;
  stubDevice?: boolean;
  target?: HTMLElement;
}): () => void {
  // NOTE: `core` should be the same instance as the one injected in the lit app
  // so we either need to instanciate it here and give it to the lit app or retrieve it from it
  const core = new LedgerButtonCore({
    stub,
    stubDevice,
  });

  const info = {
    id: uuidv4(),
    name: "Ledger Button",
    icon: "https://ledger.com/favicon.ico",
    rnds: "com.ledger.button",
  };

  const app = document.createElement("ledger-button-app") as LedgerButtonApp;
  app.core = core;

  if (target) {
    target.appendChild(app);
  } else {
    document.body.appendChild(app);
  }

  const provider = new LedgerEIP1193Provider(/*core, */ app);

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
