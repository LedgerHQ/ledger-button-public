import type {
  Wallet,
  WindowAppReadyEventAPI,
} from "@wallet-standard/base";

const REGISTER_WALLET_EVENT = "wallet-standard:register-wallet";
const APP_READY_EVENT = "wallet-standard:app-ready";

/**
 * Registers a Wallet Standard wallet and returns a function to fully unregister
 * it.
 *
 * `@wallet-standard/wallet`'s own `registerWallet` discards the `unregister`
 * callback the app hands back and permanently leaks an `app-ready` listener, so
 * a wallet registered through it can never be torn down. We reimplement the same
 * dispatch + listen handshake here but keep the `unregister` callbacks (an app
 * can become ready more than once) and remove the listener on teardown, so
 * `initializeLedgerProvider`'s cleanup can leave no trace of the wallet.
 *
 * @see https://github.com/wallet-standard/wallet-standard
 */
export function registerWalletStandard(wallet: Wallet): () => void {
  const unregisterCallbacks = new Set<() => void>();

  const register = ({ register: registerWithApp }: WindowAppReadyEventAPI) => {
    unregisterCallbacks.add(registerWithApp(wallet));
  };

  try {
    window.dispatchEvent(
      new CustomEvent(REGISTER_WALLET_EVENT, { detail: register }),
    );
  } catch (error) {
    console.error(
      "wallet-standard:register-wallet event could not be dispatched\n",
      error,
    );
  }

  const onAppReady = (event: Event) => {
    register((event as CustomEvent<WindowAppReadyEventAPI>).detail);
  };

  try {
    window.addEventListener(APP_READY_EVENT, onAppReady);
  } catch (error) {
    console.error(
      "wallet-standard:app-ready event listener could not be added\n",
      error,
    );
  }

  return () => {
    window.removeEventListener(APP_READY_EVENT, onAppReady);
    unregisterCallbacks.forEach((unregister) => unregister());
    unregisterCallbacks.clear();
  };
}
