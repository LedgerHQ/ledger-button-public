export const currencyModuleTypes = {
  CurrencyService: Symbol.for("CurrencyService"),
  FiatCurrencyDataSource: Symbol.for("FiatCurrencyDataSource"),
  ResolveCurrencyDecimalsUseCase: Symbol.for("ResolveCurrencyDecimalsUseCase"),
} as const;
