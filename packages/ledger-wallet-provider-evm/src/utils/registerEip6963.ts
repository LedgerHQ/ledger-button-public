import type { EIP1193Provider, EIP6963ProviderInfo } from "../model/EIPTypes";

/**
 * Announces an EIP-1193 provider to dApps through EIP-6963 and returns a
 * function to stop answering `eip6963:requestProvider`.
 *
 * Announces once immediately, then again each time a dApp asks for providers.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */
export function registerEip6963(
  info: EIP6963ProviderInfo,
  provider: EIP1193Provider,
): () => void {
  const announce = () => {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: Object.freeze({ info, provider }),
      }),
    );
  };

  window.addEventListener("eip6963:requestProvider", announce);
  announce();

  return () => {
    window.removeEventListener("eip6963:requestProvider", announce);
  };
}
