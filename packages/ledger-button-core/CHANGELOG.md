## 1.4.0 (2026-07-28)

### 🚀 Features

- Use browser language as preferred language for onboarding ([7b8ef86d](https://github.com/LedgerHQ/ledger-button/commit/7b8ef86d))
- Introduce developer mode with Feature Flags selection ([fe0ab709](https://github.com/LedgerHQ/ledger-button/commit/fe0ab709))
- Add a blockchain-family switcher to the home screen. When more than one family is connected, a tab bar lets the user switch the active family; the selected account is loaded lazily per family, cached for instant switch-back, and refreshed silently in the background. ([8ba1c05e](https://github.com/LedgerHQ/ledger-button/commit/8ba1c05e))

  Also fix connecting a second family: a family-specific connection request (e.g. an EVM `eth_requestAccounts` while only Solana is connected) now reaches the account picker instead of being short-circuited to the home of the already-connected family. Navigation intents carry the requested `family`, and the root navigation checks that specific family rather than any active selection.

- Introduce an active-family seam in the core context: add family-agnostic selected-account accessors (`getActiveSelectedAccount`, `getActiveFamily`, `getConnectedFamilies`, `setActiveFamily`) and an `activeFamily` field driven by a new `active_family_changed` context event. Removes the unused public `observeSelectedAccountChanges` API (breaking). ([6c9c925d](https://github.com/LedgerHQ/ledger-button/commit/6c9c925d))
- Filter the onboarding account selection by the requesting blockchain family: EVM (`eth_requestAccounts`) and Solana (Wallet Standard `connect`) requests now only list accounts compatible with the requesting dApp, while manual selection still shows every account. ([2a48b78f](https://github.com/LedgerHQ/ledger-button/commit/2a48b78f))
- Internalize EVM sign flow in EvmBlockchainProvider ([aa1b079c](https://github.com/LedgerHQ/ledger-button/commit/aa1b079c))
- Implement BlockchainProvider and WalletProvider for EVM and Solana ([c673dd05](https://github.com/LedgerHQ/ledger-button/commit/c673dd05))
- Extract WalletProviderHostService from LedgerButtonCore ([1f53c0b6](https://github.com/LedgerHQ/ledger-button/commit/1f53c0b6))
- Add Wallet Providers ([494064ca](https://github.com/LedgerHQ/ledger-button/commit/494064ca))
- Refactor Account handling ([36fac279](https://github.com/LedgerHQ/ledger-button/commit/36fac279))
- Handle OutOfMemory Error from DMK or unability to install app. ([50a7ee4e](https://github.com/LedgerHQ/ledger-button/commit/50a7ee4e))
- Add Solana off-chain message signing (solana:signMessage): sign messages through the Solana off-chain message spec envelope (V0) via @ledgerhq/device-signer-kit-solana, wired into the Wallet Standard Ledger Solana wallet and the shared signing modal pipeline ([7fa0e293](https://github.com/LedgerHQ/ledger-button/commit/7fa0e293))
- Add Solana Wallet Standard connection (connection-only): register a Ledger Solana wallet (standard:connect/disconnect/events + solana:\* chains) that is discoverable and connectable by Solana dApps via the Wallet Standard ([f14d1878](https://github.com/LedgerHQ/ledger-button/commit/f14d1878))
- Add V2 dApp config use case for multi-blockchain support ([e0044442](https://github.com/LedgerHQ/ledger-button/commit/e0044442))
- Add normalizeAddressForCurrency seam so Solana base58 addresses are preserved while EVM addresses are still lowercased ([de018c90](https://github.com/LedgerHQ/ledger-button/commit/de018c90))
- Resolve native decimals per-currency via CAL with per-chain fallback (EVM = 18, Solana = 9) ([1410b994](https://github.com/LedgerHQ/ledger-button/commit/1410b994))
- Make resolveNetworkSlug chain-agnostic (EVM + Solana) ([ffc82421](https://github.com/LedgerHQ/ledger-button/commit/ffc82421))
- Add a "View all transactions" link at the bottom of the Home transaction history tab that deep-links to the selected account in Ledger Wallet (`ledgerwallet://account`), with `view_all_transactions_clicked` product analytics. ([dfce23a1](https://github.com/LedgerHQ/ledger-button/commit/dfce23a1))

### 🩹 Fixes

- Fix CoinServiceBroadcastResponse not handled in broadcast flow ([f64d2599](https://github.com/LedgerHQ/ledger-button/commit/f64d2599))
- Decouple signed-result types per blockchain family via an inversion-of-control registry (DIP + Open/Closed): `api` owns an empty `SignedResultRegistry` seam and derives the shared `SignedResults` transport union from it, while each family owns its result union in its own folder and augments the registry there (EVM's `EvmSignedResult` now lives in `internal/evm-provider`). `api` no longer references any family code, and adding a family (Solana, BTC, XRP, ...) touches only that family's folder. A compile-time guard fails the build if the registry is empty (guards against `SignedResults` silently collapsing to `never`). Type-level only, no runtime change. ([5881da62](https://github.com/LedgerHQ/ledger-button/commit/5881da62))
- Extract the shared waitForDeviceSession device-session polling helper into internal/blockchain-provider/utils, removing the duplicated EVM copy and the Solana-to-EVM cross-family import. ([5f231a6b](https://github.com/LedgerHQ/ledger-button/commit/5f231a6b))
- Migrate internal and UI consumers to resolve the selected account through the active family. Pending-transaction tracking, transaction notifiers, navigation and the sign flow now rely on `getActiveSelectedAccount`/`getActiveFamily` instead of a hard-coded family, with no behavior change for single-family setups. ([7a2f0a38](https://github.com/LedgerHQ/ledger-button/commit/7a2f0a38))
- Add the `@ledgerhq/device-signer-kit-solana` dependency and bump the Device Management Kit stack (`device-management-kit`, `context-module`, `device-transport-kit-web-hid`) to compatible versions. ([b004fba7](https://github.com/LedgerHQ/ledger-button/commit/b004fba7))
- Add DeviceOutOfMemoryError tracking ([e190e94b](https://github.com/LedgerHQ/ledger-button/commit/e190e94b))
- Extract ContextModule and EthSigner construction into dedicated use cases ([17da6275](https://github.com/LedgerHQ/ledger-button/commit/17da6275))
- Make initializeLedgerProvider chain-agnostic: EVM (EIP-6963) and Solana (Wallet Standard) now register through a single, extensible per-chain seam, and the cleanup function fully unregisters every provider — including the Solana wallet, which previously stayed registered after cleanup. ([e5c16b49](https://github.com/LedgerHQ/ledger-button/commit/e5c16b49))
- Align the Solana cluster moniker (mainnet-beta -> mainnet) with @solana/kit conventions ([9ee862fc](https://github.com/LedgerHQ/ledger-button/commit/9ee862fc))
- Split derivation path utils per currency family and resolve Solana derivation path from the account derivation mode (solanaMain/solanaBip44Change/solanaSub) ([ad4fdd53](https://github.com/LedgerHQ/ledger-button/commit/ad4fdd53))
- Remove hard-coded decimal fallbacks and centralise fallback logic inside formatBalance ([7cc750bd](https://github.com/LedgerHQ/ledger-button/commit/7cc750bd))
- Hydrate token fiat values when native balance is zero ([46825342](https://github.com/LedgerHQ/ledger-button/commit/46825342))
- Handle user rejection during open app phase to show dedicated error screen instead of generic error ([72e96943](https://github.com/LedgerHQ/ledger-button/commit/72e96943))
- Detect un-onboarded device on connect ([59409cf9](https://github.com/LedgerHQ/ledger-button/commit/59409cf9))

### ❤️ Thank You

- Cursor @cursoragent
- Mathieu Bertin
- pdeville-ledger
- Pierre Vautherin

## 1.3.2 (2026-07-21)

### 🧹 Chores

- Version bump only for @ledgerhq/ledger-wallet-provider-core; no code changes.

## 1.3.1 (2026-07-02)

### 🩹 Fixes

- Move Storybook packages to devDependencies and bump to 9.1.19 to clear HIGH security advisories (GHSA-mjf5-7g4m-gx5w, GHSA-8452-54wp-rmv6) for SDK consumers ([30f0bee8](https://github.com/LedgerHQ/ledger-button/commit/30f0bee8))

### ❤️ Thank You

- Pierre Vautherin

## 1.3.0 (2026-06-01)

### 🚀 Features

- Introduce grouped accounts ([66375e8e](https://github.com/LedgerHQ/ledger-button/commit/66375e8e))
- Use Fiat detailed endpoint ([9e8dc617](https://github.com/LedgerHQ/ledger-button/commit/9e8dc617))
- Track language and currency change ([be1d4b0b](https://github.com/LedgerHQ/ledger-button/commit/be1d4b0b))
- Track "View transaction details" clicks on the success screen and on transaction history rows ([e81fcde6](https://github.com/LedgerHQ/ledger-button/commit/e81fcde6))
- Add refresh and add-account buttons in the select account modal, and a `forceRefresh` option on `getAccounts` to re-fetch accounts from cloud sync ([fddc1193](https://github.com/LedgerHQ/ledger-button/commit/fddc1193))
- Handle PreferredCurrency selection and storage. Update fiat balances. Enhance fiat balance formatting. ([afd06c5a](https://github.com/LedgerHQ/ledger-button/commit/afd06c5a))
- Move LedgerEIP1193Provider into ledger-button-core and expose it (along with EvmProviderUI and isBlockingRequestMethod) from the public API ([08903e06](https://github.com/LedgerHQ/ledger-button/commit/08903e06))
- Rework transaction history datasource around Coin Service account operations and surface richer transaction items (status, kind, direction, fees) in the UI with dedicated Failed and Fees rendering. ([4403f7fe](https://github.com/LedgerHQ/ledger-button/commit/4403f7fe))

  `TransactionHistoryDataSource` now exposes only neutral `TransactionHistoryEntry` / `TransactionHistoryPage` types, while all Coin Service-shaped DTOs and the `currencyId` -> network-slug resolution are confined to `datasource/coinService/`. `FetchTransactionHistoryUseCase` and `ConfirmPendingTransactionsUseCase` consume the normalized types directly and accept `currencyId`, no longer leaking Coin Service concepts (such as the `network` parameter) up through the call graph.

  Move presentation out of the use case: `TransactionHistoryItem` now carries raw values and a structured `asset` (and optional `fee.asset`) instead of pre-formatted strings; the per-currency explorer URL template lives on `TransactionHistoryResult`/`DetailedAccount.transactionExplorerUrlTemplate` so the UI presenter (`ledger-home-controller`'s `mapHistoryItemToListItem`) does its own balance formatting and explorer-URL substitution. The boundary type `TransactionHistoryEntry` no longer carries Coin Service-flavored vocabulary: `direction` is now a `TransactionDirection` and `isFees` was renamed to `isFeeOnlyOperation`.

  Follow-up (not in this change): apply the same view-model extraction to `PendingTransaction`, which still carries `formattedValue`, `ticker`, `currencyName`, and `explorerUrl` directly on the domain type.

- Handle PreferredLanguage storage ([ac818f50](https://github.com/LedgerHQ/ledger-button/commit/ac818f50))
- Add minimal Solana provider module scaffold (DI, cluster utils, RPC datasource stub) ([488ebf73](https://github.com/LedgerHQ/ledger-button/commit/488ebf73))
- Add transaction confirmation notifications ([5ebea04d](https://github.com/LedgerHQ/ledger-button/commit/5ebea04d))

### 🩹 Fixes

- Limit transaction history to 20 items ([a0d8f0b8](https://github.com/LedgerHQ/ledger-button/commit/a0d8f0b8))
- Sync account names index ([01a378e0](https://github.com/LedgerHQ/ledger-button/commit/01a378e0))
- Update DMK to latest versions for blind signing tracking ([dabf084c](https://github.com/LedgerHQ/ledger-button/commit/dabf084c))
- Add initial value to Array.reduce calls in date range helpers ([ee236e5c](https://github.com/LedgerHQ/ledger-button/commit/ee236e5c))
- Rename Alpaca to CoinService ([0e9c2a4c](https://github.com/LedgerHQ/ledger-button/commit/0e9c2a4c))
- Align event schemas with trackEvent.ts and enforce strict validation ([f3abcf47](https://github.com/LedgerHQ/ledger-button/commit/f3abcf47))
- Reorganize EVM-specific code under internal/evm-provider/ (chainUtils, JSON-RPC datasources, TransactionHelper, sign/broadcast use-cases, gas-fee estimation, DI module). Pure internal refactor; public API is byte-identical (no consumer change required). ([df9ec7de](https://github.com/LedgerHQ/ledger-button/commit/df9ec7de))
- Remove SessionAuthentication event and rename MobileRedirectLedgerWallet ([28996bd2](https://github.com/LedgerHQ/ledger-button/commit/28996bd2))
- Update unknown token translation ([e52d52b6](https://github.com/LedgerHQ/ledger-button/commit/e52d52b6))
- Sort account groups by total fiat balance (desc.) ([f37b9d95](https://github.com/LedgerHQ/ledger-button/commit/f37b9d95))
- Bump @ledgerhq/context-module to 2.1.0, @ledgerhq/device-management-kit to 1.5.1, and @ledgerhq/device-signer-kit-ethereum to 1.16.0 ([28cc3414](https://github.com/LedgerHQ/ledger-button/commit/28cc3414))

### ❤️ Thank You

- Cursor @cursoragent
- Gustavo Porto @portothree
- Mathieu Bertin
- pdeville-ledger
- Pierre Vautherin

## 1.2.0 (2026-04-10)

### 🚀 Features

- Add mobile redirect Ledger Wallet tracking event ([d5369968](https://github.com/LedgerHQ/ledger-button/commit/d5369968))
- remove redundant logger brackets ([54acfa30](https://github.com/LedgerHQ/ledger-button/commit/54acfa30))

### 🩹 Fixes

- Keep selected account on device disconnect ([45beb26b](https://github.com/LedgerHQ/ledger-button/commit/45beb26b))
- Refresh account data after pending transaction confirmation ([885f0a37](https://github.com/LedgerHQ/ledger-button/commit/885f0a37))
- Fix disconnect button sticky positioning on home screen ([55bb3135](https://github.com/LedgerHQ/ledger-button/commit/55bb3135))

### ❤️ Thank You

- Mathieu Bertin
- pdeville-ledger
