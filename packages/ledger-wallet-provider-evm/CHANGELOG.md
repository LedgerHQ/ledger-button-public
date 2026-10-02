## 1.0.0 (2026-09-30)

### 🚀 Features

- Enable blockchain tracking ([2bad6fab](https://github.com/LedgerHQ/ledger-button/commit/2bad6fab))
- Handle wallet multi-chain disconnect ([973f45d5](https://github.com/LedgerHQ/ledger-button/commit/973f45d5))
- Move chain-specific signing parameter contracts and guards out of core and into their owning EVM and Solana provider packages. Providers now send chain-neutral broadcast metadata to core for pending-transaction tracking, and core no longer depends on `@ledgerhq/device-signer-kit-ethereum`. ([603848dc](https://github.com/LedgerHQ/ledger-button/commit/603848dc))

  `SignTransactionParams`, `SignRawTransactionParams`, `SignPersonalMessageParams`, `SignTypedMessageParams`, `Transaction` and their guards now come from `@ledgerhq/ledger-wallet-provider-evm`; `SignSolanaTransactionParams`, `SignSolanaMessageParams` and their guards from `@ledgerhq/ledger-wallet-provider-solana`.

- Move the EVM get-address model and the EIP-1193 / EIP-6963 contracts from core to the EVM provider package, and stop re-exporting the EIP contracts from `@ledgerhq/ledger-wallet-provider`. Import them from `@ledgerhq/ledger-wallet-provider-evm` instead. ([7bdfea4a](https://github.com/LedgerHQ/ledger-button/commit/7bdfea4a))

  The `method` field of `SignTransactionParams` and `SignRawTransactionParams` is now typed as `string` in core, since the `RpcMethods` union it used to reference is owned by the EVM provider.

### 🩹 Fixes

- Bump signer-kit Solana to 1.13.3 & DMK to 1.10.0 ([6ee926de](https://github.com/LedgerHQ/ledger-button/commit/6ee926de))

- Bump DMK 1.9.1 + SOL signer kit 1.13.1 ([fb7fd0cb](https://github.com/LedgerHQ/ledger-button/commit/fb7fd0cb))
- Surface a device disconnection during discovery or signing with reconnection guidance. A dismissed browser device picker stays silent, and an error emitted while the signing screen is unmounted remains visible when it mounts again. ([3c3a601b](https://github.com/LedgerHQ/ledger-button/commit/3c3a601b))
- Show dedicated firmware outdated error screen ([08ca08c5](https://github.com/LedgerHQ/ledger-button/commit/08ca08c5))
- Apply dApp config minVersion when opening device apps. ([25cdd974](https://github.com/LedgerHQ/ledger-button/commit/25cdd974))
- Upgrade the build tooling to Vite 8 (Rolldown) and Vitest 5. Package bundles are now produced by Rolldown via `build.rolldownOptions`, and the Oxc decorator helpers (`@oxc-project/runtime`) are inlined instead of being left as an external runtime dependency. ([1c13df25](https://github.com/LedgerHQ/ledger-button/commit/1c13df25))
- Bump catalog patches: ethers 6.17, lit 3.3.3, @floating-ui/dom 1.8, and related lint/test tooling. Leave fake-indexeddb on 6.0.x (6.2 hangs IndexedDB tests). ([54c8599c](https://github.com/LedgerHQ/ledger-button/commit/54c8599c))
- Bump `@ledgerhq/device-management-kit` to 1.9.0 and `@ledgerhq/device-signer-kit-ethereum` to 1.18.0. ([765a4bca](https://github.com/LedgerHQ/ledger-button/commit/765a4bca))
- Upgrade Nx to 23.2.0 ([496dc210](https://github.com/LedgerHQ/ledger-button/commit/496dc210))
- Upgrade TypeScript to 6.0.3 ([f0ad775a](https://github.com/LedgerHQ/ledger-button/commit/f0ad775a))
- Implement SignRawTransaction and SignTypedData device actions ([f77c14df](https://github.com/LedgerHQ/ledger-button/commit/f77c14df))
- Bump Device Management Kit stack to latest stable releases (DMK 1.8.0, context-module 2.5.0, ethereum signer 1.17.0). ([7de16c54](https://github.com/LedgerHQ/ledger-button/commit/7de16c54))
- Keep runtime dependencies external instead of inlining them, so a dApp loads a single copy of the core, the Device Management Kit and RxJS. `rxjs`, `xstate`, `purify-ts` and `@ledgerhq/device-management-kit` are now peer dependencies of the provider packages; npm 7+, pnpm and Yarn Berry install them automatically. ([0e4e5580](https://github.com/LedgerHQ/ledger-button/commit/0e4e5580))
- Move vitest to devDependencies and exclude mock files from the core library build. ([001e40a8](https://github.com/LedgerHQ/ledger-button/commit/001e40a8))
- Pin Device Management Kit stack to develop snapshot 0.0.0-develop-20260819092631. ([02d56c9f](https://github.com/LedgerHQ/ledger-button/commit/02d56c9f))
- Omit the `.js` extension on relative and aliased imports. The workspace uses `moduleResolution: bundler`. Real package subpaths such as `lit/decorators.js` are unchanged. ([dfdce6c1](https://github.com/LedgerHQ/ledger-button/commit/dfdce6c1))
- Handle UserRejectedTransactionError for SignSolanaTransactionFlowDeviceAction and sign messages ([b9a61fd0](https://github.com/LedgerHQ/ledger-button/commit/b9a61fd0))

### ⚠️ Breaking Changes

- Extract EVM and Solana into provider packages with host-wired factories. ([e5a43e11](https://github.com/LedgerHQ/ledger-button/commit/e5a43e11))
- Internalize DAppConfig check into BlockchainProviderFactory ([3e2b40e8](https://github.com/LedgerHQ/ledger-button/commit/3e2b40e8))

### ❤️ Thank You

- Cursor @cursoragent
- pdeville-ledger
- Pierre Vautherin
