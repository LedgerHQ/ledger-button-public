import "./components/index.js";
import "./ledger-button-app.js";

import {
  type EIP6963ProviderInfo,
  LedgerButtonCore,
  type LedgerButtonCoreOptions,
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

export type InitializeLedgerProviderOptions = LedgerButtonCoreOptions & {
  target?: HTMLElement;
};

export function initializeLedgerProvider({
  apiKey,
  dAppIdentifier,
  dmkConfig = undefined,
  target = document.body,
  loggerLevel = "info",
  devConfig = {
    stub: {
      base: false,
      account: false,
      device: false,
      web3Provider: false,
      dAppConfig: false,
    },
  },
}: InitializeLedgerProviderOptions): () => void {
  // NOTE: `core` should be the same instance as the one injected in the lit app
  // so we either need to instanciate it here and give it to the lit app or retrieve it from it
  if (!core) {
    core = new LedgerButtonCore({
      apiKey,
      dAppIdentifier,
      dmkConfig,
      loggerLevel,
      devConfig,
    });
  }

  const isSupported = core.isSupported();

  if (!isSupported) {
    // NOTE: If the environment is not supported, we don't need to do anything
    // and we can just return a noop function
    return () => {
      // noop
    };
  }

  const info: EIP6963ProviderInfo = {
    uuid: uuidv4(),
    name: "Ledger",
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAMAAABOo35HAAABCFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzxr8JAAAAWHRSTlMA3//Ho7LaF/A7Xt7x7OaesRPgpsyd6OfqUJG5EO1JR0RRS6/KPEIl9bi/q7Xdzxo+QDRgyQd0BOPhPzhkXQ0Y7wHBoJkMp5MWBWLbCRWfuwZc3BShCkycOhLLgAAAAwZJREFUeNrt2FdOGwEYhdHfkwSSmJbeEzrpld57tSkG4/3vJA9GyA6KbEUzA4TzLeFI9+WGJEmSJEmSJEnKqGdPi4XcKvY8fxEptbPZ/bCQX8Xuvogk53YjpUqrSb49zh/rKFLq8CDJt1uwYMGCBQsWLFiwYMGCBSulFmC133yk1MT45WO9evmkll29vXORUlOT+7UMW9+qtMZ65w89a7811ltK9UptYJ1iqlc9gQULFixYsGDBggULFixYsGDBggULFixYsGDBggULFixYsGDBggULFixYsGDBggULFixYsGDBggULFixYsGDBggUL1jXAGsRUr7rWGmsAU72NzaS54YiZ6b3KeXuFnv7ItrHRkXsNzf7ciatZaWu50lDHm6GIcvm4se3DyLZa193Gur5+i6vZyuJSI8yDzteRe4+S5r4sWfxfu50019HJBBYsWLBgwWICCxYsWLBgMYEFCxYsWLCYwIIFCxYsWExgwYIFCxYsJrBgwYIFCxYTWLBgwYIFiwksWLBgwYLFBBYsWLBgwWICCxYsWLBgMYEFCxYsWLCYwIIFCxYsWExgwYIFCxYsJrBgwYIFCxYTWLBgwYIFiwksWJeNVWbSPlaVSdtY7z9/uvMP9X34OHsTsNJqF1b73YcFCxYsWLBgwYIFCxasq9SjJK1+Re6Vy8eNbR9GttW67qZT11Fk2sriUiPMg87XETPTe5Xz9go9/ZFtY6Mj99Lo+49yZFppa7nSUMeboYjkjwZcbvU2NpPmhi9iDWKqV11Lmrt1EesUU73qCSxYsGDBggULFixYsGDBggULFixYsGDBggULFixYsGDBggULFixYsGDBggULFixYsGDBggULFixYsGDBggULFixYsK4B1ltM9Ur7rbHeYTqrDaxXL5/Usqu3dy5Sampyv5Zh61uVFlg5NB8pNTGeZNzlYy1ESh0e/P9YR7BgwYIFCxYsWLBgwYIF68Zj7UZKlVaTfHsc8expsZBbxZ7nLyKldja7Hxbyq9jd5w+VJEmSJEmSJCmbfgMTmK0SFovSGAAAAABJRU5ErkJggg==",
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
