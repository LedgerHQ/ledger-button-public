import "./components/index";
import "./ledger-button-app";

import {
  LedgerButtonCore,
  type LedgerButtonCoreOptions,
} from "@ledgerhq/ledger-wallet-provider-core";

import { FloatingButtonPosition } from "./components/index";
import type { TransactionConfirmationNotification } from "./types/transaction-confirmation-notification";
import { setupFloatingButton } from "./utils/setup-floating-button";
import { LedgerButtonApp } from "./ledger-button-app";

export type { WalletTransactionFeature } from "./components/molecule/wallet-actions/ledger-wallet-actions";
export type {
  EIP1193Provider,
  EIP6963ProviderDetail,
  EIP6963ProviderInfo,
} from "@ledgerhq/ledger-wallet-provider-core";

import type { WalletTransactionFeature } from "./components/molecule/wallet-actions/ledger-wallet-actions";

let core: LedgerButtonCore | null = null;

export type { TransactionConfirmationNotification } from "./types/transaction-confirmation-notification";

export type InitializeLedgerProviderOptions = LedgerButtonCoreOptions & {
  target?: HTMLElement;
  hideButton?: boolean;
  floatingButtonPosition?: FloatingButtonPosition;
  floatingButtonTarget?: HTMLElement | string;
  walletTransactionFeatures?: WalletTransactionFeature[];
  transactionConfirmationNotification?: TransactionConfirmationNotification;
};

export function initializeLedgerProvider({
  apiKey,
  dAppIdentifier,
  dmkConfig = undefined,
  dmkLogLevel = "error",
  target = document.body,
  loggerLevel = "info",
  environment,
  hideButton = false,
  floatingButtonPosition = "bottom-right",
  floatingButtonTarget,
  walletTransactionFeatures,
  transactionConfirmationNotification = "tooltip",
  blockchainProviderFactories,
  devConfig = {
    stub: {
      base: false,
      account: false,
      device: false,
      web3Provider: false,
    },
  },
}: InitializeLedgerProviderOptions): () => void {
  const existingApp = target.querySelector("ledger-button-app");
  if (existingApp) {
    console.log("Ledger button app already exists");
    return () => void 0;
  }
  // NOTE: `core` should be the same instance as the one injected in the lit app
  // so we either need to instanciate it here and give it to the lit app or retrieve it from it
  if (!core) {
    core = new LedgerButtonCore({
      apiKey,
      dAppIdentifier,
      dmkConfig,
      dmkLogLevel,
      loggerLevel,
      environment,
      blockchainProviderFactories,
      devConfig,
    });
  }
  const coreInstance = core;

  const isSupportedPlatform = coreInstance.isSupportedPlatform();

  if (!isSupportedPlatform) {
    // NOTE: If the environment is not supported, we don't need to do anything
    // and we can just return a noop function
    return () => {
      // noop
    };
  }

  const fontHref =
    "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap";
  if (!document.querySelector(`link[href="${fontHref}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontHref;
    document.head.appendChild(link);
  }

  const app = document.createElement("ledger-button-app") as LedgerButtonApp;
  app.core = coreInstance;
  app.walletTransactionFeatures = walletTransactionFeatures;
  app.transactionConfirmationNotification = transactionConfirmationNotification;
  app.classList.add("ledger-wallet-provider");

  const { floatingButton } = setupFloatingButton(
    app,
    floatingButtonTarget,
    hideButton ? false : floatingButtonPosition,
    transactionConfirmationNotification,
  );

  if (target) {
    target.appendChild(app);
  } else {
    document.body.appendChild(app);
  }

  // Bridge: map core's generic navigation intents to the button UI navigation.
  const navigationSubscription = core
    .observeNavigationIntents()
    .subscribe((intent) => {
      app.navigationIntent(intent.name, intent);
    });

  // Cleanup function
  return () => {
    navigationSubscription.unsubscribe();

    if (app.parentNode) {
      app.parentNode.removeChild(app);
    }

    if (floatingButton && floatingButton.parentNode) {
      floatingButton.parentNode.removeChild(floatingButton);
    }

    // Reset core so new config can be applied on next initialization
    core = null;
  };
}
