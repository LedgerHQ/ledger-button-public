## 2.0.0-rc.0 (2026-09-11)

### 🚀 Features

- Handle wallet multi-chain disconnect ([973f45d5](https://github.com/LedgerHQ/ledger-button/commit/973f45d5))
- Add subtitle to the "You are now connected" screen. ([5bed3d47](https://github.com/LedgerHQ/ledger-button/commit/5bed3d47))
- Add configurable DMK log level. ([0ec1bc05](https://github.com/LedgerHQ/ledger-button/commit/0ec1bc05))
- Enhance Network selection screen ([f53a6e95](https://github.com/LedgerHQ/ledger-button/commit/f53a6e95))
- Port currency capability onto blockchain providers. The public `formatBalance` helper now takes `(rawBalance, decimals, ticker, options?)` — `decimals` is required and the `currencyId` argument is gone, since callers resolve decimals through CAL and the provider that owns the currency. The public `BlockchainProvider` interface now exposes a single `describeCurrency(currencyId)` / `describeNetwork(networkId)` pair returning a `CurrencyDescriptor` (`currencyId`, `family`, `networkId`, `nativeDecimals`), replacing `isSupportedCurrency`, `getNativeDecimals`, `resolveNetwork` and `resolveCurrencyId`. ([629526c7](https://github.com/LedgerHQ/ledger-button/commit/629526c7))
- Move sign-flow derivations from the UI into core. `WalletNavigationIntent` is now discriminated on `name` and its `signTransaction` variant carries an explicit `SignIntentParams` descriptor (`family`, `type`, `broadcast`) instead of an `unknown` payload. Core also exposes `observeBroadcastedTransaction(hash)`, which owns the `processing` -> `validated` lifecycle and resolves the explorer link, so the UI no longer re-derives either. ([1f10a55d](https://github.com/LedgerHQ/ledger-button/commit/1f10a55d))

  BREAKING: `WalletNavigationIntent.params` is no longer `unknown`. Consumers narrowing it to the sign-params types must read the descriptor instead.

- Implement the Wallet Standard `solana:signAndSendTransaction` feature: sign the transaction on the device, broadcast it inside the sign flow so failures surface in the modal and successes are tracked as pending transactions, and return the transaction signature. Solana broadcasts temporarily go through Ledger's public Solana node proxy while the button backend does not support them. Pending transactions, their confirmation polling, the account refresh and the explorer link are now scoped to the family the transaction was signed for instead of the active one. A pending transaction whose amount cannot be read from the signed payload no longer displays a misleading `0` amount. ([07338b4c](https://github.com/LedgerHQ/ledger-button/commit/07338b4c))

### 🩹 Fixes

- Bump catalog patches: ethers 6.17, lit 3.3.3, @floating-ui/dom 1.8, and related lint/test tooling. Leave fake-indexeddb on 6.0.x (6.2 hangs IndexedDB tests). ([54c8599c](https://github.com/LedgerHQ/ledger-button/commit/54c8599c))
- Bump `@ledgerhq/device-management-kit` to 1.9.0 and `@ledgerhq/device-signer-kit-ethereum` to 1.18.0. ([765a4bca](https://github.com/LedgerHQ/ledger-button/commit/765a4bca))
- Upgrade Nx to 23.2.0 ([496dc210](https://github.com/LedgerHQ/ledger-button/commit/496dc210))
- Upgrade TypeScript to 6.0.3 ([f0ad775a](https://github.com/LedgerHQ/ledger-button/commit/f0ad775a))
- Bump Lumen design packages and Tailwind CSS to 4.3.3. ([2c21b785](https://github.com/LedgerHQ/ledger-button/commit/2c21b785))
- Bump Device Management Kit stack to latest stable releases (DMK 1.8.0, context-module 2.5.0, ethereum signer 1.17.0). ([7de16c54](https://github.com/LedgerHQ/ledger-button/commit/7de16c54))
- Remove the eth_getBalance RPC fallback when CoinService native-balance fetch fails. ([27746883](https://github.com/LedgerHQ/ledger-button/commit/27746883))
- Keep runtime dependencies external instead of inlining them, so a dApp loads a single copy of the core, the Device Management Kit and RxJS. `rxjs`, `xstate`, `purify-ts` and `@ledgerhq/device-management-kit` are now peer dependencies of the provider packages; npm 7+, pnpm and Yarn Berry install them automatically. ([0e4e5580](https://github.com/LedgerHQ/ledger-button/commit/0e4e5580))
- Update transaction item UI to prevent icon shrinkage. ([5f868df0](https://github.com/LedgerHQ/ledger-button/commit/5f868df0))
- Pin Device Management Kit stack to develop snapshot 0.0.0-develop-20260819092631. ([02d56c9f](https://github.com/LedgerHQ/ledger-button/commit/02d56c9f))
- Omit the `.js` extension on relative and aliased imports. The workspace uses `moduleResolution: bundler`. Real package subpaths such as `lit/decorators.js` are unchanged. ([dfdce6c1](https://github.com/LedgerHQ/ledger-button/commit/dfdce6c1))
- Consume the core account derivation APIs from the UI instead of rebuilding them: the account list, token list and network list controllers no longer duplicate fiat aggregation, grouping, search filtering or network computation. ([6f9a60b8](https://github.com/LedgerHQ/ledger-button/commit/6f9a60b8))
- Remove internal ticket references and obsolete scope comments from source files. ([4906cba0](https://github.com/LedgerHQ/ledger-button/commit/4906cba0))

### ⚠️  Breaking Changes

- Extract EVM and Solana into provider packages with host-wired factories. ([e5a43e11](https://github.com/LedgerHQ/ledger-button/commit/e5a43e11))
- Move the EVM get-address model and the EIP-1193 / EIP-6963 contracts from core to the EVM provider package, and stop re-exporting the EIP contracts from `@ledgerhq/ledger-wallet-provider`. Import them from `@ledgerhq/ledger-wallet-provider-evm` instead. ([7bdfea4a](https://github.com/LedgerHQ/ledger-button/commit/7bdfea4a))

  The `method` field of `SignTransactionParams` and `SignRawTransactionParams` is now typed as `string` in core, since the `RpcMethods` union it used to reference is owned by the EVM provider.

- Internalize DAppConfig check into BlockchainProviderFactory ([3e2b40e8](https://github.com/LedgerHQ/ledger-button/commit/3e2b40e8))

### ❤️ Thank You

- Cursor @cursoragent
- pdeville-ledger
- Pierre Vautherin

## 1.4.2 (2026-08-18)

This was a version bump only for @ledgerhq/ledger-wallet-provider to align it with other projects, there were no code changes.

## 1.4.1 (2026-08-18)

### 🧹 Chores

- Version bump only for @ledgerhq/ledger-wallet-provider to align with @ledgerhq/ledger-wallet-provider-core 1.4.1; no functional changes in this package.
## 1.4.0 (2026-07-28)

### 🚀 Features

- Introduce developer mode with Feature Flags selection ([fe0ab709](https://github.com/LedgerHQ/ledger-button/commit/fe0ab709))
- Add a blockchain-family switcher to the home screen. When more than one family is connected, a tab bar lets the user switch the active family; the selected account is loaded lazily per family, cached for instant switch-back, and refreshed silently in the background. ([8ba1c05e](https://github.com/LedgerHQ/ledger-button/commit/8ba1c05e))

  Also fix connecting a second family: a family-specific connection request (e.g. an EVM `eth_requestAccounts` while only Solana is connected) now reaches the account picker instead of being short-circuited to the home of the already-connected family. Navigation intents carry the requested `family`, and the root navigation checks that specific family rather than any active selection.

- Filter the onboarding account selection by the requesting blockchain family: EVM (`eth_requestAccounts`) and Solana (Wallet Standard `connect`) requests now only list accounts compatible with the requesting dApp, while manual selection still shows every account. ([2a48b78f](https://github.com/LedgerHQ/ledger-button/commit/2a48b78f))
- Internalize EVM sign flow in EvmBlockchainProvider ([aa1b079c](https://github.com/LedgerHQ/ledger-button/commit/aa1b079c))
- Implement BlockchainProvider and WalletProvider for EVM and Solana ([c673dd05](https://github.com/LedgerHQ/ledger-button/commit/c673dd05))
- Add Wallet Providers ([494064ca](https://github.com/LedgerHQ/ledger-button/commit/494064ca))
- Refactor Account handling ([36fac279](https://github.com/LedgerHQ/ledger-button/commit/36fac279))
- Handle OutOfMemory Error from DMK or unability to install app. ([50a7ee4e](https://github.com/LedgerHQ/ledger-button/commit/50a7ee4e))
- Display the package version in a footer at the bottom of the Settings screen. The version is read dynamically from package.json so it always reflects the published version. ([11a59958](https://github.com/LedgerHQ/ledger-button/commit/11a59958))
- Add Solana off-chain message signing (solana:signMessage): sign messages through the Solana off-chain message spec envelope (V0) via @ledgerhq/device-signer-kit-solana, wired into the Wallet Standard Ledger Solana wallet and the shared signing modal pipeline ([7fa0e293](https://github.com/LedgerHQ/ledger-button/commit/7fa0e293))
- Add Solana Wallet Standard connection (connection-only): register a Ledger Solana wallet (standard:connect/disconnect/events + solana:\* chains) that is discoverable and connectable by Solana dApps via the Wallet Standard ([f14d1878](https://github.com/LedgerHQ/ledger-button/commit/f14d1878))
- Resolve token icons via Ledger CDN and CoinGecko mapping ([3ef3d161](https://github.com/LedgerHQ/ledger-button/commit/3ef3d161))
- Add a "View all transactions" link at the bottom of the Home transaction history tab that deep-links to the selected account in Ledger Wallet (`ledgerwallet://account`), with `view_all_transactions_clicked` product analytics. ([dfce23a1](https://github.com/LedgerHQ/ledger-button/commit/dfce23a1))

### 🩹 Fixes

- Filter the account picker by the active blockchain family when switching account from the home panel ([7fac57d3](https://github.com/LedgerHQ/ledger-button/commit/7fac57d3))
- Use the full-screen background flare loading animation when switching blockchain family on the home screen ([ab0846d7](https://github.com/LedgerHQ/ledger-button/commit/ab0846d7))
- Migrate internal and UI consumers to resolve the selected account through the active family. Pending-transaction tracking, transaction notifiers, navigation and the sign flow now rely on `getActiveSelectedAccount`/`getActiveFamily` instead of a hard-coded family, with no behavior change for single-family setups. ([7a2f0a38](https://github.com/LedgerHQ/ledger-button/commit/7a2f0a38))
- Move Storybook packages to devDependencies and bump to 9.1.19 to clear HIGH security advisories (GHSA-mjf5-7g4m-gx5w, GHSA-8452-54wp-rmv6) for SDK consumers ([7571fbaa](https://github.com/LedgerHQ/ledger-button/commit/7571fbaa))
- Add DeviceOutOfMemoryError tracking ([e190e94b](https://github.com/LedgerHQ/ledger-button/commit/e190e94b))
- Make initializeLedgerProvider chain-agnostic: EVM (EIP-6963) and Solana (Wallet Standard) now register through a single, extensible per-chain seam, and the cleanup function fully unregisters every provider — including the Solana wallet, which previously stayed registered after cleanup. ([e5c16b49](https://github.com/LedgerHQ/ledger-button/commit/e5c16b49))
- Remove hard-coded decimal fallbacks and centralise fallback logic inside formatBalance ([7cc750bd](https://github.com/LedgerHQ/ledger-button/commit/7cc750bd))
- Handle user rejection during open app phase to show dedicated error screen instead of generic error ([72e96943](https://github.com/LedgerHQ/ledger-button/commit/72e96943))
- Fix smartling export ([9d8f1841](https://github.com/LedgerHQ/ledger-button/commit/9d8f1841))
- Filter pending transactions by selected account ([d769c69a](https://github.com/LedgerHQ/ledger-button/commit/d769c69a))
- Detect un-onboarded device on connect ([59409cf9](https://github.com/LedgerHQ/ledger-button/commit/59409cf9))
- Truncate long account name in toolbar to prevent overflow ([6cf5ed38](https://github.com/LedgerHQ/ledger-button/commit/6cf5ed38))

### ❤️ Thank You

- Claude Opus 4.8
- Claude Opus 4.8 (1M context)
- Cursor @cursoragent
- Mathieu Bertin
- pdeville-ledger
- Pierre Vautherin

## 1.3.2 (2026-07-21)

### 🩹 Fixes

- Fix Morpho UI discrepancy by increasing z-index ([4ad0b165](https://github.com/LedgerHQ/ledger-button-public/commit/4ad0b165))

### ❤️ Thank You

- Pierre Vautherin

## 1.3.1 (2026-07-02)

### 🩹 Fixes

- Move Storybook packages to devDependencies and bump to 9.1.19 to clear HIGH security advisories (GHSA-mjf5-7g4m-gx5w, GHSA-8452-54wp-rmv6) for SDK consumers ([30f0bee8](https://github.com/LedgerHQ/ledger-button/commit/30f0bee8))

### ❤️ Thank You

- Pierre Vautherin

## 1.3.0 (2026-06-01)

### 🚀 Features

- Handle localized shop URLs ([1cfeba5b](https://github.com/LedgerHQ/ledger-button/commit/1cfeba5b))
- Format currencies (LQA) ([2d8c5782](https://github.com/LedgerHQ/ledger-button/commit/2d8c5782))
- Grouped accounts UI review ([4256875d](https://github.com/LedgerHQ/ledger-button/commit/4256875d))
- Introduce grouped accounts ([66375e8e](https://github.com/LedgerHQ/ledger-button/commit/66375e8e))
- Add toast and transaction notifications components ([807b50e7](https://github.com/LedgerHQ/ledger-button/commit/807b50e7))
- Improve settings selection UX ([603be19b](https://github.com/LedgerHQ/ledger-button/commit/603be19b))
- Use Fiat detailed endpoint ([9e8dc617](https://github.com/LedgerHQ/ledger-button/commit/9e8dc617))
- Track language and currency change ([be1d4b0b](https://github.com/LedgerHQ/ledger-button/commit/be1d4b0b))
- Track "View transaction details" clicks on the success screen and on transaction history rows ([e81fcde6](https://github.com/LedgerHQ/ledger-button/commit/e81fcde6))
- Add refresh and add-account buttons in the select account modal, and a `forceRefresh` option on `getAccounts` to re-fetch accounts from cloud sync ([fddc1193](https://github.com/LedgerHQ/ledger-button/commit/fddc1193))
- Handle PreferredCurrency selection and storage. Update fiat balances. Enhance fiat balance formatting. ([afd06c5a](https://github.com/LedgerHQ/ledger-button/commit/afd06c5a))
- Move LedgerEIP1193Provider into ledger-button-core and expose it (along with EvmProviderUI and isBlockingRequestMethod) from the public API ([08903e06](https://github.com/LedgerHQ/ledger-button/commit/08903e06))
- Localize home screen tab labels (Tokens / Transactions) via the i18n translation files ([beb1fb6c](https://github.com/LedgerHQ/ledger-button/commit/beb1fb6c))
- Rework transaction history datasource around Coin Service account operations and surface richer transaction items (status, kind, direction, fees) in the UI with dedicated Failed and Fees rendering. ([4403f7fe](https://github.com/LedgerHQ/ledger-button/commit/4403f7fe))

  `TransactionHistoryDataSource` now exposes only neutral `TransactionHistoryEntry` / `TransactionHistoryPage` types, while all Coin Service-shaped DTOs and the `currencyId` -> network-slug resolution are confined to `datasource/coinService/`. `FetchTransactionHistoryUseCase` and `ConfirmPendingTransactionsUseCase` consume the normalized types directly and accept `currencyId`, no longer leaking Coin Service concepts (such as the `network` parameter) up through the call graph.

  Move presentation out of the use case: `TransactionHistoryItem` now carries raw values and a structured `asset` (and optional `fee.asset`) instead of pre-formatted strings; the per-currency explorer URL template lives on `TransactionHistoryResult`/`DetailedAccount.transactionExplorerUrlTemplate` so the UI presenter (`ledger-home-controller`'s `mapHistoryItemToListItem`) does its own balance formatting and explorer-URL substitution. The boundary type `TransactionHistoryEntry` no longer carries Coin Service-flavored vocabulary: `direction` is now a `TransactionDirection` and `isFees` was renamed to `isFeeOnlyOperation`.

  Follow-up (not in this change): apply the same view-model extraction to `PendingTransaction`, which still carries `formattedValue`, `ticker`, `currencyName`, and `explorerUrl` directly on the domain type.

- Add explorer links to transaction list rows ([9299afe3](https://github.com/LedgerHQ/ledger-button/commit/9299afe3))
- Sign transaction broadcast status card ([48fe48e9](https://github.com/LedgerHQ/ledger-button/commit/48fe48e9))
- Add Settings entry point for Language ([ac818f50](https://github.com/LedgerHQ/ledger-button/commit/ac818f50))
- Add floating button badge with animation system ([d6a99e0f](https://github.com/LedgerHQ/ledger-button/commit/d6a99e0f))
- Add transaction confirmation notifications ([5ebea04d](https://github.com/LedgerHQ/ledger-button/commit/5ebea04d))

### 🩹 Fixes

- Update i18n keys ([d4ebe214](https://github.com/LedgerHQ/ledger-button/commit/d4ebe214))
- Skip morph animation when floating button is hidden ([87d206a4](https://github.com/LedgerHQ/ledger-button/commit/87d206a4))
- Fix SonarQube medium code smells ([d33ca185](https://github.com/LedgerHQ/ledger-button/commit/d33ca185))
- Adapt ledger-icon to Lumen design system (numeric size scale) ([650dac84](https://github.com/LedgerHQ/ledger-button/commit/650dac84))
- Rework "You are now connected" modal to match Figma design ([a7db0252](https://github.com/LedgerHQ/ledger-button/commit/a7db0252))
- Extract nested ternaries into independent statements ([c5df7d0c](https://github.com/LedgerHQ/ledger-button/commit/c5df7d0c))
- Mark never-reassigned class members as readonly ([0695dd8d](https://github.com/LedgerHQ/ledger-button/commit/0695dd8d))
- Fix mobile drawer slide animation ([c063fc0a](https://github.com/LedgerHQ/ledger-button/commit/c063fc0a))
- Fix mobile onboarding redirect tracking event not firing ([#384](https://github.com/LedgerHQ/ledger-button/pull/384))
- Update unknown token translation ([e52d52b6](https://github.com/LedgerHQ/ledger-button/commit/e52d52b6))
- Sort account groups by total fiat balance (desc.) ([f37b9d95](https://github.com/LedgerHQ/ledger-button/commit/f37b9d95))
- Bump @ledgerhq/context-module to 2.1.0, @ledgerhq/device-management-kit to 1.5.1, and @ledgerhq/device-signer-kit-ethereum to 1.16.0 ([28cc3414](https://github.com/LedgerHQ/ledger-button/commit/28cc3414))
- Fix account name overflow ([20524af8](https://github.com/LedgerHQ/ledger-button/commit/20524af8))

### ❤️ Thank You

- Cursor @cursoragent
- Gustavo Porto @portothree
- Mathieu Bertin @mbertin-ledger
- pdeville-ledger
- Pierre Vautherin

## 1.2.0 (2026-04-10)

### 🚀 Features

- Add mobile redirect Ledger Wallet tracking event ([d5369968](https://github.com/LedgerHQ/ledger-button/commit/d5369968))
- Add hideButton config to allow hiding the floating button ([b8e6d745](https://github.com/LedgerHQ/ledger-button/commit/b8e6d745))
- Make floating button opt-in when no target or position is set ([456ab403](https://github.com/LedgerHQ/ledger-button/commit/456ab403))
- Remove modal header on mobile redirection screen ([619e2329](https://github.com/LedgerHQ/ledger-button/commit/619e2329))
- Add tooltip Lit web component ([08687741](https://github.com/LedgerHQ/ledger-button/commit/08687741))
- Add account request screen UI component and controller ([b1e36624](https://github.com/LedgerHQ/ledger-button/commit/b1e36624))

### 🩹 Fixes

- Add missing crypto icon mappings for Sonic and Gnosis ([153d418d](https://github.com/LedgerHQ/ledger-button/commit/153d418d))
- Refresh account data after pending transaction confirmation ([885f0a37](https://github.com/LedgerHQ/ledger-button/commit/885f0a37))
- Fix disconnect button sticky positioning on home screen ([55bb3135](https://github.com/LedgerHQ/ledger-button/commit/55bb3135))
- Replace "Connect a Ledger" by "Connect a Ledger device" ([4d860825](https://github.com/LedgerHQ/ledger-button/commit/4d860825))

### ❤️ Thank You

- Gustavo Porto @portothree
- Mathieu Bertin
- pdeville-ledger
