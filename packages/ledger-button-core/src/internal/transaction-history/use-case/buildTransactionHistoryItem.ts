import { formatBalance } from "../../currency/currencyUtils.js";
import { buildExplorerTransactionUrl } from "../../transaction/utils/buildExplorerTransactionUrl.js";
import type {
  TransactionDirection,
  TransactionHistoryEntry,
  TransactionHistoryItem,
  TransactionKind,
  TransactionStatus,
  TransactionType,
} from "../model/transactionHistoryTypes.js";

export type AssetInfo = {
  ledgerId: string;
  name: string;
  ticker: string;
  decimals: number;
};

export type BuildTransactionHistoryItemArgs = {
  entry: TransactionHistoryEntry;
  normalizedAddress: string;
  assetInfo: AssetInfo;
  nativeAssetInfo: AssetInfo;
  transactionExplorerUrlTemplate: string | undefined;
};

/**
 * Pure transformation of a normalized `TransactionHistoryEntry` (plus its
 * resolved asset metadata) into a display-ready `TransactionHistoryItem`.
 *
 * This function has no I/O, no DI, and no logger. The async resolution of
 * `assetInfo` (CAL lookups, caching) stays in the use case, so this remains
 * trivially unit-testable.
 */
export function buildTransactionHistoryItem({
  entry,
  normalizedAddress,
  assetInfo,
  nativeAssetInfo,
  transactionExplorerUrlTemplate,
}: BuildTransactionHistoryItemArgs): TransactionHistoryItem {
  const direction = determineDirection(entry, normalizedAddress);
  const kind = determineKind(entry);
  const status = determineStatus(entry);
  const { fee, formattedFee, feeTicker } = extractFee(
    entry,
    normalizedAddress,
    nativeAssetInfo,
  );

  return {
    hash: entry.hash,
    type: toLegacyType(direction),
    direction,
    kind,
    status,
    value: entry.value,
    formattedValue: formatBalance(
      entry.value,
      assetInfo.decimals,
      assetInfo.ticker,
    ),
    currencyName: assetInfo.name,
    ticker: assetInfo.ticker,
    timestamp: entry.timestamp,
    blockHeight: entry.blockHeight,
    ledgerId: assetInfo.ledgerId,
    explorerUrl:
      buildExplorerTransactionUrl(
        transactionExplorerUrlTemplate,
        entry.hash,
      ) ?? undefined,
    fee,
    formattedFee,
    feeTicker,
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

export function extractFee(
  entry: TransactionHistoryEntry,
  normalizedAddress: string,
  nativeAssetInfo: AssetInfo,
): { fee?: string; formattedFee?: string; feeTicker?: string } {
  const fee = entry.fee;
  if (!fee) {
    return {};
  }

  if (fee.payer && fee.payer !== normalizedAddress) {
    return {};
  }

  return {
    fee: fee.amount,
    formattedFee: formatBalance(
      fee.amount,
      nativeAssetInfo.decimals,
      nativeAssetInfo.ticker,
    ),
    feeTicker: nativeAssetInfo.ticker,
  };
}
