---
"@ledgerhq/ledger-wallet-provider-core": major
"@ledgerhq/ledger-wallet-provider": patch
---

Port currency capability onto blockchain providers. **Breaking:** the public `formatBalance` helper now takes `(rawBalance, decimals, ticker, options?)` — `decimals` is required and the `currencyId` argument is gone, since callers resolve decimals through CAL and the provider that owns the currency.
