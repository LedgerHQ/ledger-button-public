export const balanceModuleTypes = {
  BalanceService: Symbol.for("BalanceService"),
  CoinServiceDataSource: Symbol.for("CoinServiceDataSource"),
  CalDataSource: Symbol.for("CalDataSource"),
  CounterValueDataSource: Symbol.for("CounterValueDataSource"),
  FiatCurrencyDataSource: Symbol.for("FiatCurrencyDataSource"),
} as const;
