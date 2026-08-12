/**
 * Neutral account shape exposed to blockchain provider modules.
 *
 * Mirrors the fields a provider needs (address, currency, derivation) without
 * pulling the richer `Account` model into the package boundary. Core's
 * `Account` is a structural superset, so it can be passed directly
 * wherever a {@link ProviderAccount} is expected.
 */
export type ProviderAccount = {
  id: string;
  currencyId: string;
  freshAddress: string;
  derivationMode: string;
  index: number;
};
