import type {
  BlockchainFamily,
  WalletProvider,
} from "../../api/blockchain-provider/model/types.js";
import type {
  EIP1193Provider,
  EIP6963ProviderInfo,
} from "../../api/model/eip/EIPTypes.js";

const LEDGER_ICON_WHITE =
  "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIzLjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxMTQ5LjA0IDEwNDkuNDciIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiNGRkZGRkY7fQo8L3N0eWxlPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTkwLjA2LDY2OS4zNXYxOTAuMDZoMjg5LjIydi00Mi4xNEgyMzIuMjFWNjY5LjM1SDE5MC4wNnogTTkxNi44Myw2NjkuMzV2MTQ3LjkySDY2OS43NXY0Mi4xNGgyODkuMjJWNjY5LjM1CglIOTE2LjgzeiBNNDc5LjcsMzgwLjEydjI4OS4yMmgxOTAuMDV2LTM4LjAxSDUyMS44NFYzODAuMTJINDc5Ljd6IE0xOTAuMDYsMTkwLjA2djE5MC4wNmg0Mi4xNFYyMzIuMjFoMjQ3LjA4di00Mi4xNEgxOTAuMDZ6CgkgTTY2OS43NSwxOTAuMDZ2NDIuMTRoMjQ3LjA4djE0Ny45Mmg0Mi4xNFYxOTAuMDZINjY5Ljc1eiIvPgo8L3N2Zz4K";

const LEDGER_ICON_BLACK =
  "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIzLjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxMTQ5LjA0IDEwNDkuNDciIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMwMDAwMDA7fQo8L3N0eWxlPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTkwLjA2LDY2OS4zNXYxOTAuMDZoMjg5LjIydi00Mi4xNEgyMzIuMjFWNjY5LjM1SDE5MC4wNnogTTkxNi44Myw2NjkuMzV2MTQ3LjkySDY2OS43NXY0Mi4xNGgyODkuMjJWNjY5LjM1CglIOTE2LjgzeiBNNDc5LjcsMzgwLjEydjI4OS4yMmgxOTAuMDV2LTM4LjAxSDUyMS44NFYzODAuMTJINDc5Ljd6IE0xOTAuMDYsMTkwLjA2djE5MC4wNmg0Mi4xNFYyMzIuMjFoMjQ3LjA4di00Mi4xNEgxOTAuMDZ6CgkgTTY2OS43NSwxOTAuMDZ2NDIuMTRoMjQ3LjA4djE0Ny45Mmg0Mi4xNFYxOTAuMDZINjY5Ljc1eiIvPgo8L3N2Zz4K";

/**
 * EVM {@link WalletProvider}: handles EIP-6963 discovery (announce +
 * `requestProvider` listener) and returns a teardown.
 *
 * Wraps the {@link EIP1193Provider} instance created by
 * {@link EvmBlockchainProvider} and announces it to dApps.
 */
export class EvmWalletProvider implements WalletProvider {
  public readonly family: BlockchainFamily = "ethereum";

  constructor(private readonly eip1193Provider: EIP1193Provider) {}

  init(): () => void {
    const info: EIP6963ProviderInfo = {
      uuid: this.generateUuid(),
      name: "Ledger Wallet",
      icon: this.resolveIcon(),
      rdns: "com.ledger.wallet.provider",
    };

    const announce = () => {
      window.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: Object.freeze({ info, provider: this.eip1193Provider }),
        }),
      );
    };

    window.addEventListener("eip6963:requestProvider", announce);
    announce();

    return () => {
      window.removeEventListener("eip6963:requestProvider", announce);
    };
  }

  private resolveIcon(): string {
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme:dark)").matches;
    return prefersDark ? LEDGER_ICON_WHITE : LEDGER_ICON_BLACK;
  }

  private generateUuid(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
