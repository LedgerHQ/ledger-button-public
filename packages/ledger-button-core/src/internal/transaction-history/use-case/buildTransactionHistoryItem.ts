import type {
  TransactionDirection,
  TransactionHistoryEntry,
  TransactionHistoryItem,
  TransactionHistoryItemAsset,
  TransactionHistoryItemFee,
  TransactionKind,
  TransactionStatus,
  TransactionType,
} from "../model/transactionHistoryTypes.js";

export type AssetInfo = TransactionHistoryItemAsset;

export type BuildTransactionHistoryItemArgs = {
  entry: TransactionHistoryEntry;
  normalizedAddress: string;
  assetInfo: AssetInfo;
  nativeAssetInfo: AssetInfo;
};

/**
 * Pure transformation of a normalized `TransactionHistoryEntry` (plus its
 * resolved asset metadata) into a domain-level `TransactionHistoryItem`.
 *
 * The result carries raw values only; the presentation layer is responsible
 * for formatting amounts, building explorer URLs, and any locale-aware
 * display. This function has no I/O, no DI, and no logger.
 */
export function buildTransactionHistoryItem({
  entry,
  normalizedAddress,
  assetInfo,
  nativeAssetInfo,
}: BuildTransactionHistoryItemArgs): TransactionHistoryItem {
  const direction = determineDirection(entry, normalizedAddress);

  return {
    hash: entry.hash,
    type: toLegacyType(direction),
    direction,
    kind: determineKind(entry),
    status: determineStatus(entry),
    value: entry.value,
    asset: assetInfo,
    timestamp: entry.timestamp,
    blockHeight: entry.blockHeight,
    fee: extractFee(entry, normalizedAddress, nativeAssetInfo),
  };
}

export function determineDirection(
  entry: TransactionHistoryEntry,
  normalizedAddress: string,
): TransactionDirection {
  const isSender = entry.senders.includes(normalizedAddress);
  const isRecipient = entry.recipients.includes(normalizedAddress);

  if (isSender && isRecipient) {
    return "self";
  }
  if (isSender) {
    return "sent";
  }
  if (isRecipient) {
    return "received";
  }
  return entry.direction ?? "self";
}

export function determineKind(entry: TransactionHistoryEntry): TransactionKind {
  return entry.isFeeOnlyOperation ? "fees" : "transfer";
}

export function determineStatus(
  entry: TransactionHistoryEntry,
): TransactionStatus {
  return entry.failed ? "failed" : "confirmed";
}

export function toLegacyType(direction: TransactionDirection): TransactionType {
  return direction === "received" ? "received" : "sent";
}

/**
 * Returns the fee paid by the user, if any, in raw form. The fee asset is
 * the native asset of the chain — adapters whose providers charge gas in a
 * non-native asset would need a richer signal on `TransactionHistoryEntry`.
 */
export function extractFee(
  entry: TransactionHistoryEntry,
  normalizedAddress: string,
  nativeAssetInfo: AssetInfo,
): TransactionHistoryItemFee | undefined {
  const fee = entry.fee;
  if (!fee) {
    return undefined;
  }
  if (fee.payer && fee.payer !== normalizedAddress) {
    return undefined;
  }
  return {
    amount: fee.amount,
    asset: nativeAssetInfo,
  };
}
