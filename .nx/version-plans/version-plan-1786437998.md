---
"@ledgerhq/ledger-wallet-provider-core": major
"@ledgerhq/ledger-wallet-provider": major
---

Port currency capability onto blockchain providers. **Breaking:** the public `formatBalance` helper now takes `(rawBalance, decimals, ticker, options?)` — `decimals` is required and the `currencyId` argument is gone, since callers resolve decimals through CAL and the provider that owns the currency. **Breaking:** the public `BlockchainProvider` interface now exposes a single `describeCurrency(currencyId)` / `describeNetwork(networkId)` pair returning a `CurrencyDescriptor` (`currencyId`, `family`, `networkId`, `nativeDecimals`), replacing `isSupportedCurrency`, `getNativeDecimals`, `resolveNetwork` and `resolveCurrencyId`.
