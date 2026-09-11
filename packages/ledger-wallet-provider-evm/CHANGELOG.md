## 1.0.0-rc.0 (2026-09-11)

### 🚀 Features

- Handle wallet multi-chain disconnect ([973f45d5](https://github.com/LedgerHQ/ledger-button/commit/973f45d5))
- Move chain-specific signing parameter contracts and guards out of core and into their owning EVM and Solana provider packages. Providers now send chain-neutral broadcast metadata to core for pending-transaction tracking, and core no longer depends on `@ledgerhq/device-signer-kit-ethereum`. ([603848dc](https://github.com/LedgerHQ/ledger-button/commit/603848dc))

  `SignTransactionParams`, `SignRawTransactionParams`, `SignPersonalMessageParams`, `SignTypedMessageParams`, `Transaction` and their guards now come from `@ledgerhq/ledger-wallet-provider-evm`; `SignSolanaTransactionParams`, `SignSolanaMessageParams` and their guards from `@ledgerhq/ledger-wallet-provider-solana`.

- Move the EVM get-address model and the EIP-1193 / EIP-6963 contracts from core to the EVM provider package, and stop re-exporting the EIP contracts from `@ledgerhq/ledger-wallet-provider`. Import them from `@ledgerhq/ledger-wallet-provider-evm` instead. ([7bdfea4a](https://github.com/LedgerHQ/ledger-button/commit/7bdfea4a))

  The `method` field of `SignTransactionParams` and `SignRawTransactionParams` is now typed as `string` in core, since the `RpcMethods` union it used to reference is owned by the EVM provider.


### 🩹 Fixes

- Bump catalog patches: ethers 6.17, lit 3.3.3, @floating-ui/dom 1.8, and related lint/test tooling. Leave fake-indexeddb on 6.0.x (6.2 hangs IndexedDB tests). ([54c8599c](https://github.com/LedgerHQ/ledger-button/commit/54c8599c))
- Bump `@ledgerhq/device-management-kit` to 1.9.0 and `@ledgerhq/device-signer-kit-ethereum` to 1.18.0. ([765a4bca](https://github.com/LedgerHQ/ledger-button/commit/765a4bca))
- Upgrade Nx to 23.2.0 ([496dc210](https://github.com/LedgerHQ/ledger-button/commit/496dc210))
- Upgrade TypeScript to 6.0.3 ([f0ad775a](https://github.com/LedgerHQ/ledger-button/commit/f0ad775a))
- Bump Device Management Kit stack to latest stable releases (DMK 1.8.0, context-module 2.5.0, ethereum signer 1.17.0). ([7de16c54](https://github.com/LedgerHQ/ledger-button/commit/7de16c54))
- Keep runtime dependencies external instead of inlining them, so a dApp loads a single copy of the core, the Device Management Kit and RxJS. `rxjs`, `xstate`, `purify-ts` and `@ledgerhq/device-management-kit` are now peer dependencies of the provider packages; npm 7+, pnpm and Yarn Berry install them automatically. ([0e4e5580](https://github.com/LedgerHQ/ledger-button/commit/0e4e5580))
- Move vitest to devDependencies and exclude mock files from the core library build. ([001e40a8](https://github.com/LedgerHQ/ledger-button/commit/001e40a8))
- Pin Device Management Kit stack to develop snapshot 0.0.0-develop-20260819092631. ([02d56c9f](https://github.com/LedgerHQ/ledger-button/commit/02d56c9f))
- Omit the `.js` extension on relative and aliased imports. The workspace uses `moduleResolution: bundler`. Real package subpaths such as `lit/decorators.js` are unchanged. ([dfdce6c1](https://github.com/LedgerHQ/ledger-button/commit/dfdce6c1))

### ⚠️  Breaking Changes

- Extract EVM and Solana into provider packages with host-wired factories. ([e5a43e11](https://github.com/LedgerHQ/ledger-button/commit/e5a43e11))
- Internalize DAppConfig check into BlockchainProviderFactory ([3e2b40e8](https://github.com/LedgerHQ/ledger-button/commit/3e2b40e8))

### ❤️ Thank You

- Cursor @cursoragent
- pdeville-ledger
- Pierre Vautherin