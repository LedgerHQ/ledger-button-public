## 1.3.2 (2026-07-21)

### 🩹 Fixes

- Fix Morpho UI discrepancy by increasing z-index ([4ad0b165](https://github.com/LedgerHQ/ledger-button/commit/4ad0b165))

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
