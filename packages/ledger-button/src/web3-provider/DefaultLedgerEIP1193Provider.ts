/**
 * Ledger EIP-1193 Provider
 *
 * A complete implementation of the EIP-1193 Ethereum Provider JavaScript API
 * for Ledger hardware wallets.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1193
 * @see https://eips.ethereum.org/EIPS/eip-1102
 * @see https://eips.ethereum.org/EIPS/eip-6963
 * @see https://eips.ethereum.org/EIPS/eip-2255
 */

import "../ledger-button-app.js";

import { LedgerButtonCore } from "@ledgerhq/ledger-button-core";
import { v4 as uuidv4 } from "uuid";

import {
  ChainInfo,
  CommonEIP1193ErrorCode,
  EIP1193Provider,
  EIP6963AnnounceProviderEvent,
  EIP6963RequestProviderEvent,
  ProviderConnectInfo,
  // EthSendTransactionParams,
  // ProviderConnectInfo,
  ProviderEvent,
  ProviderMessage,
  ProviderRpcError,
  RequestArguments,
  // RpcMethods,
} from "./LedgerEIP1193Provider.js";

// NOTE: First draft only, args to be improved, name as well
// Probably needs improvement, but it could be the entry point of the library
export function onLoad(args: { core: LedgerButtonCore }): () => void {
  // NOTE: `core` should be the same instance as the one injected in the lit app
  // so we either need to instanciate it here and give it to the lit app or retrieve it from it
  const provider = new DefaultLedgerEIP1193Provider(args.core);
  const info = {
    id: uuidv4(),
    name: "Ledger Button",
    icon: "https://ledger.com/favicon.ico",
    rnds: "com.ledger.button",
  };

  const listener = (_: Event) => {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: Object.freeze({ info, provider }),
      }),
    );
  };

  window.addEventListener("eip6963:requestProvider", listener);

  window.dispatchEvent(
    new CustomEvent("eip6963:announceProvider", {
      detail: Object.freeze({ info, provider }),
    }),
  );

  // Cleanup function
  return () => {
    window.removeEventListener("eip6963:requestProvider", listener);
  };
}

export class DefaultLedgerEIP1193Provider
  extends EventTarget
  implements EIP1193Provider
{
  private _isConnected = false;
  // private _accounts: string[] = [];
  private _supportedChains: Map<string, ChainInfo> = new Map();
  private _listeners: Map<
    (...args: unknown[]) => void,
    (e: CustomEvent | Event) => void
  > = new Map();

  constructor(private readonly core: LedgerButtonCore) {
    super();
    console.log("DefaultLedgerEIP1193Provider", this.core);
    this.initializeSupportedChains();
  }

  // Public API
  request({ method, params }: RequestArguments): Promise<unknown> {
    console.log("request", method, params);
    switch (method) {
      case "eth_accounts":
      case "eth_requestAccounts":
      case "eth_blockNumber":
      case "eth_call":
      case "eth_chainId":
      case "eth_estimateGas":
      case "eth_gasPrice":
      case "eth_getBalance":
      case "eth_sendTransaction":
      case "eth_sendRawTransaction":
      case "eth_signTransaction":
      case "personal_sign":
      case "eth_sign":
      case "net_version":
        throw new Error("Not implemented");
      default:
        throw this.createError(
          CommonEIP1193ErrorCode.UnsupportedMethod,
          `Method ${method} not supported`,
        );
    }
  }

  on(eventName: ProviderEvent, listener: (...args: unknown[]) => void): this {
    this._listeners.set(listener, (e) => {
      if (e instanceof CustomEvent) {
        listener(...e.detail);
      }
    });

    const fn = this._listeners.get(listener);
    if (!fn) return this;

    this.addEventListener(eventName, fn);
    return this;
  }

  removeListener(
    eventName: ProviderEvent,
    listener: (...args: unknown[]) => void,
  ): this {
    const fn = this._listeners.get(listener);
    if (!fn) return this;
    this.removeEventListener(eventName, fn);
    this._listeners.delete(listener);
    return this;
  }

  isConnected(): boolean {
    console.log("isConnected", this._isConnected);
    throw new Error("Method not implemented.");
  }

  // NOTE: Those next two might be private in the end.
  async connect(): Promise<void> {
    // TODO: Logic to check if we are connected to a chain
    if (!this._isConnected) {
      this._isConnected = true;
      this.dispatchEvent(
        new CustomEvent<ProviderConnectInfo>("connect", {
          bubbles: true,
          composed: true,
          detail: {
            chainId: "0x1", // TODO: Replace with the actual chainId
          },
        }),
      );
    }
  }

  async disconnect(
    code = 1000, // NOTE: Code here must follow the [CloseEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes) convention
    message = "Provider disconnected",
    data?: unknown,
  ): Promise<void> {
    // TODO: Logic to disconnect from the chain
    if (this._isConnected) {
      this._isConnected = false;
      this.dispatchEvent(
        new CustomEvent<ProviderRpcError>("disconnect", {
          bubbles: true,
          composed: true,
          detail: this.createError(code, message, data),
        }),
      );
    }
  }

  // Private API
  private createError(
    code: number,
    message: string,
    data?: unknown,
  ): ProviderRpcError {
    const error = new Error(message) as ProviderRpcError;
    error.code = code;
    error.data = data;
    return error;
  }

  private initializeSupportedChains(): void {
    // NOTE: Initialize with common Ethereum chains (infos to be verified!)
    this._supportedChains.set("0x1", {
      chainId: "0x1",
      chainName: "Ethereum Mainnet",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://ethereum.publicnode.com"],
      blockExplorerUrls: ["https://etherscan.io"],
    });
  }
}

declare global {
  interface CustomEventMap {
    connect: CustomEvent<ProviderConnectInfo>;
    disconnect: CustomEvent<ProviderRpcError>;
    chainChanged: CustomEvent<ProviderConnectInfo>;
    accountsChanged: CustomEvent<{ accounts: string[] }>;
    message: CustomEvent<ProviderMessage>;
    "eip6963:announceProvider": EIP6963AnnounceProviderEvent;
    "eip6963:requestProvider": EIP6963RequestProviderEvent;
  }
}

// NOTE: This is an example implementation generated by AI. There might be
// some interesting bits in there, keeping it for the inspiration only for now.
// To be removed in the future.

// export class DefaultLedgerEIP1193Provider
//   extends EventTarget
//   implements EIP1193Provider
// {
//   private _isConnected = false;
//   private _currentChainId = "0x1"; // Ethereum mainnet by default
//   private _accounts: string[] = [];
//   private _supportedChains: Map<string, ChainInfo> = new Map();

//   constructor(private readonly core: LedgerButtonCore) {
//     super();
//     this.initializeSupportedChains();
//   }

//   on(eventName: string, listener: (...args: unknown[]) => void): this {
//     this.addEventListener(eventName, (event) => {
//       if (event instanceof CustomEvent) {
//         listener(...event.detail);
//       }
//     });
//     return this;
//   }

//   removeListener(
//     eventName: RpcMethods,
//     listener: (...args: unknown[]) => void,
//   ): this {
//     this.removeEventListener(eventName, listener);
//     return this;
//   }

//   private initializeSupportedChains(): void {
//     // Initialize with common Ethereum chains
//     this._supportedChains.set("0x1", {
//       chainId: "0x1",
//       chainName: "Ethereum Mainnet",
//       nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
//       rpcUrls: ["https://ethereum.publicnode.com"],
//       blockExplorerUrls: ["https://etherscan.io"],
//     });

//     // this._supportedChains.set("0x89", {
//     //   chainId: "0x89",
//     //   chainName: "Polygon Mainnet",
//     //   nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
//     //   rpcUrls: ["https://polygon-rpc.com"],
//     //   blockExplorerUrls: ["https://polygonscan.com"],
//     // });
//   }

//   async request(args: RequestArguments): Promise<unknown> {
//     try {
//       switch (args.method) {
//         case "eth_accounts":
//           return await this.handleRequestAccounts();

//         case "eth_chainId":
//           return this._currentChainId;

//         case "eth_sendTransaction":
//           return await this.handleSendTransaction(
//             args.params as [EthSendTransactionParams],
//           );

//         case "eth_signTransaction":
//           return await this.handleSignTransaction(
//             args.params as [EthSendTransactionParams],
//           );

//         case "personal_sign":
//           return await this.handlePersonalSign(args.params as [string, string]);

//         case "eth_sign":
//           return await this.handleEthSign(args.params as [string, string]);

//         // case "eth_signTypedData_v4":
//         //   return await this.handleSignTypedData(args.params as [string, any]);

//         // case "wallet_switchEthereumChain":
//         //   return await this.handleSwitchChain(
//         //     args.params as [WalletSwitchEthereumChainParams],
//         //   );

//         // case "wallet_addEthereumChain":
//         //   return await this.handleAddChain(
//         //     args.params as [WalletAddEthereumChainParams],
//         //   );

//         case "net_version":
//           return parseInt(this._currentChainId, 16).toString();

//         default:
//           throw this.createError(
//             EIP1193ErrorCode.UnsupportedMethod,
//             `Method ${args.method} not supported`,
//           );
//       }
//     } catch (error) {
//       if (error instanceof Error && "code" in error) {
//         throw error;
//       }
//       throw this.createError(
//         EIP1193ErrorCode.InternalError,
//         `Internal error: ${error}`,
//       );
//     }
//   }

//   isConnected(): boolean {
//     return this._isConnected;
//   }

//   private async handleRequestAccounts(): Promise<string[]> {
//     try {
//       const accounts = await this.core.fetchAccounts();
//       this._accounts = accounts.caseOf({
//         Right: (accounts) => accounts.map((account) => account.freshAddress),
//         Left: (_) => {
//           // TODO: handle error
//           return [];
//         },
//       });

//       if (!this._isConnected) {
//         this._isConnected = true;
//         this.dispatchEvent(
//           new CustomEvent<ProviderConnectInfo>("connect", {
//             bubbles: true,
//             composed: true,
//             detail: {
//               chainId: this._currentChainId,
//             },
//           }),
//         );
//       }

//       this.dispatchEvent(
//         new CustomEvent<string[]>("accountsChanged", {
//           bubbles: true,
//           composed: true,
//           detail: this._accounts,
//         }),
//       );
//       return this._accounts;
//     } catch (_error: unknown) {
//       throw this.createError(
//         EIP1193ErrorCode.UserRejectedRequest,
//         "User rejected account access",
//       );
//     }
//   }

//   private async handleSendTransaction(
//     params: [EthSendTransactionParams],
//   ): Promise<string> {
//     if (!this._isConnected || this._accounts.length === 0) {
//       throw this.createError(
//         EIP1193ErrorCode.Unauthorized,
//         "No accounts available",
//       );
//     }

//     const [txParams] = params;

//     // Convert transaction params to the format expected by SignTransaction
//     const rawTransaction = this.buildRawTransaction(txParams);

//     try {
//       const result = await this.signTransaction.execute({
//         rawTransaction,
//         derivationPath: this.getDerivationPathForAccount(txParams.from),
//       });

//       return result.hash;
//     } catch (_error: unknown) {
//       throw this.createError(
//         EIP1193ErrorCode.UserRejectedRequest,
//         "Transaction was rejected",
//       );
//     }
//   }

//   private async handleSignTransaction(
//     params: [EthSendTransactionParams],
//   ): Promise<string> {
//     const [txParams] = params;
//     const rawTransaction = this.buildRawTransaction(txParams);

//     try {
//       const result = await this.signTransaction.execute({
//         rawTransaction,
//         derivationPath: this.getDerivationPathForAccount(txParams.from),
//       });

//       return result.rawTransaction;
//     } catch (_error: unknown) {
//       throw this.createError(
//         EIP1193ErrorCode.UserRejectedRequest,
//         "Transaction signing was rejected",
//       );
//     }
//   }

//   private async handlePersonalSign(params: [string, string]): Promise<string> {
//     const [_message, address] = params;

//     if (!this._accounts.includes(address)) {
//       throw this.createError(
//         EIP1193ErrorCode.Unauthorized,
//         "Account not available",
//       );
//     }

//     // Implementation would depend on Ledger device signing capabilities
//     throw this.createError(
//       EIP1193ErrorCode.UnsupportedMethod,
//       "Personal sign not yet implemented",
//     );
//   }

//   private async handleEthSign(params: [string, string]): Promise<string> {
//     const [address, _message] = params;

//     if (!this._accounts.includes(address)) {
//       throw this.createError(
//         EIP1193ErrorCode.Unauthorized,
//         "Account not available",
//       );
//     }

//     // Implementation would depend on Ledger device signing capabilities
//     throw this.createError(
//       EIP1193ErrorCode.UnsupportedMethod,
//       "eth_sign not yet implemented",
//     );
//   }

//   // private async handleSignTypedData(params: [string, any]): Promise<string> {
//   //   const [address, _typedData] = params;

//   //   if (!this._accounts.includes(address)) {
//   //     throw this.createError(
//   //       EIP1193ErrorCode.Unauthorized,
//   //       "Account not available",
//   //     );
//   //   }

//   //   // Implementation would depend on Ledger device signing capabilities
//   //   throw this.createError(
//   //     EIP1193ErrorCode.UnsupportedMethod,
//   //     "Typed data signing not yet implemented",
//   //   );
//   // }

//   // private async handleSwitchChain(
//   //   params: [WalletSwitchEthereumChainParams],
//   // ): Promise<null> {
//   //   const [{ chainId }] = params;

//   //   if (!this._supportedChains.has(chainId)) {
//   //     throw this.createError(
//   //       EIP1193ErrorCode.UnsupportedMethod,
//   //       `Chain ${chainId} not supported`,
//   //     );
//   //   }

//   //   if (this._currentChainId !== chainId) {
//   //     this._currentChainId = chainId;
//   //     this.dispatchEvent(
//   //       new CustomEvent<string>("chainChanged", {
//   //         bubbles: true,
//   //         composed: true,
//   //         detail: chainId,
//   //       }),
//   //     );
//   //   }

//   //   return null;
//   // }

//   // private async handleAddChain(
//   //   params: [WalletAddEthereumChainParams],
//   // ): Promise<null> {
//   //   const [chainParams] = params;

//   //   this._supportedChains.set(chainParams.chainId, {
//   //     chainId: chainParams.chainId,
//   //     chainName: chainParams.chainName,
//   //     nativeCurrency: chainParams.nativeCurrency,
//   //     rpcUrls: chainParams.rpcUrls,
//   //     blockExplorerUrls: chainParams.blockExplorerUrls,
//   //   });

//   //   return null;
//   // }

//   private buildRawTransaction(params: EthSendTransactionParams): string {
//     // This is a simplified implementation
//     // In a real implementation, you'd need to properly encode the transaction
//     // using RLP encoding or a library like viem
//     return JSON.stringify(params);
//   }

//   private getDerivationPathForAccount(_address: string): string {
//     // This would need to map addresses to their derivation paths
//     // For now, using a default Ethereum derivation path
//     return "m/44'/60'/0'/0/0";
//   }

//   private createError(
//     code: number,
//     message: string,
//     data?: unknown,
//   ): ProviderRpcError {
//     const error = new Error(message) as ProviderRpcError;
//     error.code = code;
//     error.data = data;
//     return error;
//   }

//   // Connection management
//   async connect(): Promise<void> {
//     if (!this._isConnected) {
//       // TODO: Make sure we have a valid chainId and we can connect to it
//       this._isConnected = true;
//       this.dispatchEvent(
//         new CustomEvent<ProviderConnectInfo>("connect", {
//           bubbles: true,
//           composed: true,
//           detail: {
//             chainId: this._currentChainId,
//           },
//         }),
//       );
//     }
//   }

//   async disconnect(): Promise<void> {
//     if (this._isConnected) {
//       this._isConnected = false;
//       this._accounts = [];
//       this.dispatchEvent(
//         new CustomEvent<ProviderRpcError>("disconnect", {
//           bubbles: true,
//           composed: true,
//           detail: this.createError(1000, "Provider disconnected"),
//         }),
//       );

//       this.dispatchEvent(
//         new CustomEvent<string[]>("accountsChanged", {
//           bubbles: true,
//           composed: true,
//           detail: [],
//         }),
//       );
//     }
//   }
// }
