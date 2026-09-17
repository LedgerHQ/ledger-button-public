# @ledgerhq/ledger-wallet-provider

A comprehensive Web Components-based library that provides a complete Ledger hardware wallet integration solution for web applications. Built with Lit and designed to work with any frontend framework.

## Features

- **EIP-1193 Provider**: Complete Ethereum Provider implementation with full JSON-RPC support
- **EIP-6963 Support**: Multi-wallet discovery and selection
- **Solana Support**: Solana wallet integration via Wallet Standard
- **Framework Agnostic**: Works with any frontend framework (React, Vue, Angular, Svelte, etc.)
- **Hardware Wallet Integration**: Direct connection to Ledger devices via USB and Bluetooth
- **Modern UI**: Pre-built components with Tailwind CSS styling and dark mode support
- **Transaction Signing**: Support for multi-blockchain transactions, typed data, and personal messages
- **Account Management**: Multi-account support and switching
- **Ledger Sync Integration**: Seamless integration with Ledger's cloud services
- **Device Management**: Support for multiple device types and connection methods

## Installation

```bash
npm install @ledgerhq/ledger-wallet-provider
npm install @ledgerhq/ledger-wallet-provider-evm      # EVM (EIP-6963 / EIP-1193)
npm install @ledgerhq/ledger-wallet-provider-solana   # Solana (Wallet Standard)
```

You can also install with yarn or pnpm. Skip a family package if you do not support that chain.

> The family packages declare `rxjs`, `xstate`, `purify-ts` and `@ledgerhq/device-management-kit` as peer dependencies, so they share a single instance with the UI package. npm 7+, pnpm and Yarn Berry install them for you; on Yarn 1, add them explicitly.

## Quick Start

### Basic Setup

This example is a multi-chain setup. Register only the families you installed: a factory whose chain is not enabled for your `dAppIdentifier` is skipped at init, and leaving one out keeps it out of your bundle.

```javascript
import { initializeLedgerProvider } from "@ledgerhq/ledger-wallet-provider";
import "@ledgerhq/ledger-wallet-provider/styles.css";
import { evmBlockchainProviderFactory } from "@ledgerhq/ledger-wallet-provider-evm";
import { solanaBlockchainProviderFactory } from "@ledgerhq/ledger-wallet-provider-solana";

// Initialize the Ledger provider
const cleanup = initializeLedgerProvider({
  dAppIdentifier: "my-dapp", // Your dApp identifier
  apiKey: "your-api-key", // Your Ledger API key
  walletTransactionFeatures: ["send", "receive", "buy", "earn", "sell", "swap"], // Quick action to make available
  blockchainProviderFactories: [
    evmBlockchainProviderFactory,
    solanaBlockchainProviderFactory,
  ],
});

// EVM only: ask the provider to announce itself (EIP-6963)
window.dispatchEvent(new Event("eip6963:requestProvider"));
```

The Solana wallet needs no equivalent call: it announces itself through the
Wallet Standard as soon as `initializeLedgerProvider` runs. Discover it with
`getWallets()` from `@wallet-standard/app`, or let a wallet adapter such as
`@solana/wallet-adapter` pick it up. Never dispatch `wallet-standard:app-ready`
yourself — that event carries the app's `register` callback, and emitting a bare
one will throw inside the wallet.

### React Integration

```tsx
import { useEffect, useState, useCallback } from 'react';
import type { EIP6963ProviderDetail } from '@ledgerhq/ledger-wallet-provider-evm';
import { evmBlockchainProviderFactory } from '@ledgerhq/ledger-wallet-provider-evm';
import { solanaBlockchainProviderFactory } from '@ledgerhq/ledger-wallet-provider-solana';

function useProviders() {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<EIP6963ProviderDetail | null>(null);

  const handleAnnounceProvider = useCallback((e: CustomEvent<EIP6963ProviderDetail>) => {
    setProviders(prev => {
      const found = prev.find(p => p.info.uuid === e.detail.info.uuid);
      if (found) return prev;
      return [...prev, e.detail];
    });
  }, []);

  useEffect(() => {
    // Dynamic import is required because the library uses browser APIs
    // and won't work with Server-Side Rendering (SSR)
    const initializeProvider = async () => {
      const { initializeLedgerProvider } = await import('@ledgerhq/ledger-wallet-provider');

      const cleanup = initializeLedgerProvider({
        dAppIdentifier: 'my-dapp',
        apiKey: 'your-api-key',
        blockchainProviderFactories: [
          evmBlockchainProviderFactory,
          solanaBlockchainProviderFactory,
        ],
      });

      window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);

      return cleanup;
    };

    let cleanup: (() => void) | undefined;

    initializeProvider().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
      window.removeEventListener('eip6963:announceProvider', handleAnnounceProvider);
    };
  }, [handleAnnounceProvider]);

  return { providers, selectedProvider, setSelectedProvider };
}

function App() {
  const { providers, selectedProvider, setSelectedProvider } = useProviders();
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    if (!selectedProvider) return;

    try {
      const accounts = await selectedProvider.provider.request({
        method: 'eth_requestAccounts',
        params: []
      });
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const signTransaction = async (transaction: any) => {
    if (!selectedProvider) return;

    try {
      const result = await selectedProvider.provider.request({
        method: 'eth_signTransaction',
        params: [transaction]
      });
      return result;
    } catch (error) {
      console.error('Failed to sign transaction:', error);
    }
  };

  return (
    <div>
      {providers.map(provider => (
        <button
          key={provider.info.uuid}
          onClick={() => setSelectedProvider(provider)}
        >
          Connect {provider.info.name}
        </button>
      ))}

      {selectedProvider && (
        <button onClick={connectWallet}>
          Request Accounts
        </button>
      )}

      {account && <p>Connected: {account}</p>}
    </div>
  );
}
```

## API Reference

### `initializeLedgerProvider(options)`

Initializes the Ledger Wallet Provider and injects the UI components into the DOM.

#### Parameters

```typescript
{
  // Core options
  apiKey?: string;             // Your Ledger API key
  dAppIdentifier?: string;     // Your dApp identifier
  loggerLevel?: string;        // default: 'info'
  blockchainProviderFactories?: BlockchainProviderFactory[]; // Blockchain families to register

  // Ui options
  target?: HTMLElement;        // Target element to mount UI (default: document.body)
  hideButton?: boolean;        // Mount the UI without rendering the floating button (default: false)
  floatingButtonPosition?:     // default: 'bottom-right'
    | 'bottom-right' | 'bottom-left' | 'bottom-center'
    | 'top-right' | 'top-left' | 'top-center'
    | 'middle-right';
  floatingButtonTarget?: HTMLElement | string;  // Render the button into your own element instead
  walletTransactionFeatures?: Array<'send' | 'receive' | 'swap' | 'buy' | 'earn' | 'sell'>;  // Wallet action CTAs to display
  transactionConfirmationNotification?: 'tooltip' | 'toast';  // How TX confirmation is shown (default: 'tooltip')

  // Dev/debug - Only for Ledger use
  devConfig?: { stub: Partial<Record<'balance' | 'base' | 'account' | 'device' | 'web3Provider' | 'transactionHistory', boolean>> };
  environment?: 'staging' | 'production';
  dmkConfig?: DeviceModuleOptions;
  dmkLogLevel?: string;        // default: 'error'
}
```

#### Returns

A cleanup function to remove the provider and UI components.

### `LedgerEIP1193Provider`

The main provider class that implements the EIP-1193 standard.

#### Methods

- `request({ method, params })` - Make JSON-RPC requests
- `on(event, listener)` - Listen to provider events
- `removeListener(event, listener)` - Remove event listeners
- `isConnected()` - Check connection status
- `disconnect()` - Disconnect from the provider

#### Supported Methods

Handled locally by the provider:

- `eth_requestAccounts` - Request user accounts
- `eth_accounts` - Get current accounts
- `eth_chainId` - Get current chain ID
- `eth_sendTransaction` - Send and sign transactions
- `eth_signTransaction` - Sign transactions
- `eth_signRawTransaction` - Sign raw transactions
- `eth_sendRawTransaction` - Send raw transactions
- `eth_sign` - Sign messages
- `personal_sign` - Sign personal messages
- `eth_signTypedData` - Sign typed data (EIP-712)
- `eth_signTypedData_v4` - Sign typed data v4 (EIP-712)
- `wallet_switchEthereumChain` - Switch to a supported chain ID

Forwarded to the node RPC:

- `eth_blockNumber` - Get the latest block number
- `eth_getBalance` - Get account balance
- `eth_getCode` - Get contract bytecode
- `eth_estimateGas` - Estimate gas for a call
- `eth_call` - Execute a read-only call

Your partner dApp configuration can add methods to either group, and can force a
normally-local method to be forwarded instead.

#### Events

- `accountsChanged` - Fired when accounts change
- `chainChanged` - Fired when chain changes
- `connect` - Fired when provider connects
- `disconnect` - Fired when provider disconnects

## Server-Side Rendering (SSR) Compatibility

The library uses browser-specific APIs and requires dynamic imports in SSR environments:

```javascript
// ❌ Don't do this in SSR environments
import { initializeLedgerProvider } from "@ledgerhq/ledger-wallet-provider";

// ✅ Use dynamic imports instead
useEffect(() => {
  const initializeProvider = async () => {
    const { initializeLedgerProvider } =
      await import("@ledgerhq/ledger-wallet-provider");
    return initializeLedgerProvider({/* options */});
  };

  initializeProvider();
}, []);
```

**Why dynamic imports are necessary:**

- The library uses Web APIs (`window`, `document`, `CustomEvent`) that don't exist in Node.js
- Direct imports will cause build errors in SSR frameworks (Next.js, Nuxt, SvelteKit, etc.)
- Dynamic imports ensure the code only runs in the browser environment

## Styling

Import the CSS file to get the default styling:

```javascript
import "@ledgerhq/ledger-wallet-provider/styles.css";
```

## Development Mode

These options are intended for internal use by Ledger Team, for development and testing.

```javascript
const cleanup = initializeLedgerProvider({
  devConfig: {
    stub: {
      base: true, // Enable base stub mode
      account: true, // Mock account operations
      device: true, // Mock device interactions
      web3Provider: true, // Mock Web3 provider responses
      balance: true, // Mock balances
      transactionHistory: true, // Mock transaction history
    },
  },
  dAppIdentifier: "my-dapp",
  apiKey: "your-api-key",
});
```

## Requirements

- ES2020+ support
- Modern bundler (Vite, Webpack 5+, etc.)
- Browser environment (no Node.js server-side execution)
- Web HID API support (for USB connections)
- Web Bluetooth API support (for Bluetooth connections)
- **Note**: Mobile browsers are not supported due to Web HID/BLE API not being implemented

## Browser Support

- **Desktop**: Chrome 89+, Firefox 89+, Safari 14.1+, Edge 89+
- **Mobile**: Not supported (Web HID/BLE APIs not available)
- **Web Extensions**: Supported in manifest v3 extensions

## Building

Run `nx build ledger-wallet-provider` to build the library.

## Testing

Run `nx test ledger-wallet-provider` to execute the unit tests via [Vitest](https://vitest.dev/).

## Storybook

Run `nx storybook ledger-wallet-provider` to start the Storybook development server for component development and testing.

## Version

See [CHANGELOG.md](./CHANGELOG.md) for the released versions and their changes.

## License

This project is licensed under the MIT License.
