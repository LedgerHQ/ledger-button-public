import type {
  LedgerXrpApi,
  XrpApiEvent,
  XrpApiListener,
  XrpConnectOptions,
} from "../LedgerXrpApi";

const REQUEST_PROVIDER_EVENT = "ledger-xrpl:requestProvider";
const ANNOUNCE_PROVIDER_EVENT = "ledger-xrpl:announceProvider";

/**
 * Builds the object announced to dApps: a frozen facade that copies only the
 * {@link LedgerXrpApi} members. The implementation instance has more (such as
 * `setSelectedAccount`) and must not be reachable by the dApp.
 */
export function createXrpApiFacade(api: LedgerXrpApi): LedgerXrpApi {
  return Object.freeze({
    family: api.family,
    connect: (options?: XrpConnectOptions) => api.connect(options),
    disconnect: () => api.disconnect(),
    getAccount: () => api.getAccount(),
    fetchAccount: () => api.fetchAccount(),
    sign: (tx: Record<string, unknown>) => api.sign(tx),
    signAndSubmit: (tx: Record<string, unknown>) => api.signAndSubmit(tx),
    on: (event: XrpApiEvent, listener: XrpApiListener) =>
      api.on(event, listener),
    off: (event: XrpApiEvent, listener: XrpApiListener) =>
      api.off(event, listener),
  });
}

/**
 * Announces the XRP provider to dApps and returns a function to fully
 * unregister it. XRPL has no EIP-6963 equivalent, so this mirrors its
 * handshake:
 *  - dApp -> wallets: window event `ledger-xrpl:requestProvider`
 *  - wallet -> dApp:  window event `ledger-xrpl:announceProvider` with `{ info, provider }`
 *
 * The announced `provider` is a frozen facade, not the instance passed in.
 */
export function registerXrpProvider(api: LedgerXrpApi): () => void {
  const detail = Object.freeze({
    info: Object.freeze({
      uuid: "ledger-button-xrp",
      name: "Ledger",
      rdns: "com.ledger",
    }),
    provider: createXrpApiFacade(api),
  });

  const announce = () => {
    window.dispatchEvent(new CustomEvent(ANNOUNCE_PROVIDER_EVENT, { detail }));
  };

  window.addEventListener(REQUEST_PROVIDER_EVENT, announce);
  announce();

  return () => {
    window.removeEventListener(REQUEST_PROVIDER_EVENT, announce);
  };
}
