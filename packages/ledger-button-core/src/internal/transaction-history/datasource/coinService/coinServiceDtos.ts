/**
 * Private wire-format types for the Coin Service account-operations endpoint.
 *
 * GET https://coin-service.api.ledger.com/v1/{network}/account/{address}/operations
 *
 * These types intentionally never leave the `coinService/` adapter folder.
 * `DefaultTransactionHistoryDataSource` maps them to the domain types
 * (`TransactionHistoryEntry`, `TransactionHistoryPage`) before returning to
 * callers, so no use case ever sees a Coin Service-shaped object.
 *
 * Source of truth: Coin Service account-operations OpenAPI spec.
 */

export type CoinServiceAddress = string;

export type CoinServiceOperationAssetDto = {
  type: string;
  assetReference?: string;
};

export type CoinServiceBlockInfoDto = {
  height: number;
  time?: string;
};

/**
 * Note on `hash`: the Coin Service API occasionally returns operations with a
 * missing/empty `tx.hash`. The adapter drops those at the boundary, so
 * downstream domain entries can rely on `hash` being a non-empty string.
 */
export type CoinServiceOperationTransactionDto = {
  hash: string;
  fees: string;
  block: CoinServiceBlockInfoDto;
  failed: boolean;
  date?: string;
  feesPayer?: CoinServiceAddress;
};

/**
 * EVM-specific operation details. Per the spec, `details` is loosely typed
 * (`additionalProperties: true`); only the field the adapter actually reads
 * is declared here.
 */
export type CoinServiceEvmOperationDetailsDto = {
  assetAmount?: string;
};

export type CoinServiceAccountOperationDto = {
  id: string;
  tx: CoinServiceOperationTransactionDto;
  type: string;
  value: string;
  senders: CoinServiceAddress[];
  recipients: CoinServiceAddress[];
  asset?: CoinServiceOperationAssetDto;
  details?: CoinServiceEvmOperationDetailsDto;
};

export type CoinServiceAccountOperationsResponseDto = {
  items: CoinServiceAccountOperationDto[];
  next?: string;
};
