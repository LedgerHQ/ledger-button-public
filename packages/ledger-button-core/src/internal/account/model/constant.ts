export const DEFAULT_FIAT_CURRENCY = "usd";

export const SUPPORTED_FIAT_CURRENCIES = ["usd", "eur", "gbp"] as const;

export type SupportedFiatCurrency = (typeof SUPPORTED_FIAT_CURRENCIES)[number];
