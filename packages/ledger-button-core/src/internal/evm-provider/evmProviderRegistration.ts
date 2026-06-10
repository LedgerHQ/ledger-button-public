import type { EIP6963ProviderInfo } from "../../api/model/eip/EIPTypes.js";
import { generateUUID } from "../event-tracking/utils.js";
import type { ChainProviderRegistration } from "../provider-registration/ChainProviderRegistration.js";
import { getLedgerProviderIcon } from "../provider-registration/ledgerProviderIcon.js";
import { LedgerEIP1193Provider } from "./LedgerEIP1193Provider.js";

/**
 * Announces the Ledger wallet to EVM dApps through the
 * [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) discovery protocol.
 */
export const evmProviderRegistration: ChainProviderRegistration = {
  chain: "evm",
  register({ core, app }) {
    const provider = new LedgerEIP1193Provider(core, app);

    const info: EIP6963ProviderInfo = {
      uuid: generateUUID(),
      name: "Ledger Wallet",
      icon: getLedgerProviderIcon(),
      rdns: "com.ledger.wallet.provider",
    };

    const announceProvider = () => {
      window.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: Object.freeze({ info, provider }),
        }),
      );
    };

    window.addEventListener("eip6963:requestProvider", announceProvider);
    announceProvider();

    return () => {
      window.removeEventListener("eip6963:requestProvider", announceProvider);
    };
  },
};
