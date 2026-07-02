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
