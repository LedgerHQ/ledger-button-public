import { describe, expect, it } from "vitest";

import type {
  TransactionHistoryEntry,
  TransactionHistoryEntryAsset,
  TransactionHistoryEntryFee,
} from "../model/transactionHistoryTypes.js";
import {
  AssetInfo,
  buildTransactionHistoryItem,
  determineDirection,
  determineKind,
  determineStatus,
  extractFee,
  toLegacyType,
} from "./buildTransactionHistoryItem.js";

const TEST_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

const NATIVE_ASSET: TransactionHistoryEntryAsset = { isNative: true };

const NATIVE_ASSET_INFO: AssetInfo = {
  ledgerId: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  decimals: 18,
};

const ERC20_ASSET_INFO: AssetInfo = {
  ledgerId: "ethereum/erc20/usdc",
  name: "USD Coin",
  ticker: "USDC",
  decimals: 6,
};

function makeEntry(
  overrides: Partial<TransactionHistoryEntry> = {},
): TransactionHistoryEntry {
  return {
    hash: "0xabc123",
    value: "0",
    senders: [],
    recipients: [],
    fee: undefined,
    failed: false,
    blockHeight: 19_000_000,
    timestamp: "2024-01-15T10:30:00Z",
    asset: NATIVE_ASSET,
    direction: "sent",
    isFeeOnlyOperation: false,
    ...overrides,
  };
}

describe("determineDirection", () => {
  it("returns 'sent' when address is in senders only", () => {
    const entry = makeEntry({
      senders: [TEST_ADDRESS],
      recipients: ["0xrecipient"],
    });
    expect(determineDirection(entry, TEST_ADDRESS)).toBe("sent");
  });

  it("returns 'received' when address is in recipients only", () => {
    const entry = makeEntry({
      senders: ["0xsender"],
      recipients: [TEST_ADDRESS],
    });
    expect(determineDirection(entry, TEST_ADDRESS)).toBe("received");
  });

  it("returns 'self' when address is in both senders and recipients", () => {
    const entry = makeEntry({
      senders: [TEST_ADDRESS],
      recipients: [TEST_ADDRESS],
    });
    expect(determineDirection(entry, TEST_ADDRESS)).toBe("self");
  });

  it("falls back to entry.direction='sent' when address is in neither list", () => {
    const entry = makeEntry({ senders: [], recipients: [], direction: "sent" });
    expect(determineDirection(entry, TEST_ADDRESS)).toBe("sent");
  });

  it("falls back to entry.direction='received' when address is in neither list", () => {
    const entry = makeEntry({
      senders: [],
      recipients: [],
      direction: "received",
    });
    expect(determineDirection(entry, TEST_ADDRESS)).toBe("received");
  });

  it("falls back to entry.direction='self' when address is in neither list", () => {
    const entry = makeEntry({ senders: [], recipients: [], direction: "self" });
    expect(determineDirection(entry, TEST_ADDRESS)).toBe("self");
  });

  it("returns 'self' when no direction signal is available", () => {
    const entry = makeEntry({
      senders: [],
      recipients: [],
      direction: undefined,
    });
    expect(determineDirection(entry, TEST_ADDRESS)).toBe("self");
  });
});

describe("determineKind", () => {
  it("returns 'fees' when entry.isFeeOnlyOperation is true", () => {
    expect(determineKind(makeEntry({ isFeeOnlyOperation: true }))).toBe("fees");
  });

  it("returns 'transfer' when entry.isFeeOnlyOperation is false", () => {
    expect(determineKind(makeEntry({ isFeeOnlyOperation: false }))).toBe(
      "transfer",
    );
  });
});

describe("determineStatus", () => {
  it("returns 'failed' when entry.failed is true", () => {
    expect(determineStatus(makeEntry({ failed: true }))).toBe("failed");
  });

  it("returns 'confirmed' when entry.failed is false", () => {
    expect(determineStatus(makeEntry({ failed: false }))).toBe("confirmed");
  });
});

describe("toLegacyType", () => {
  it("maps 'received' to 'received'", () => {
    expect(toLegacyType("received")).toBe("received");
  });

  it.each(["sent", "self"] as const)("maps '%s' to 'sent'", (direction) => {
    expect(toLegacyType(direction)).toBe("sent");
  });
});

describe("extractFee", () => {
  it("returns empty object when entry has no fee", () => {
    const entry = makeEntry({ fee: undefined });
    expect(extractFee(entry, TEST_ADDRESS, NATIVE_ASSET_INFO)).toEqual({});
  });

  it("returns empty object when fee.payer is someone else", () => {
    const fee: TransactionHistoryEntryFee = {
      amount: "21000000000000",
      payer: "0xothersponsor",
    };
    expect(extractFee(makeEntry({ fee }), TEST_ADDRESS, NATIVE_ASSET_INFO)).toEqual({});
  });

  it("populates fee fields when user is the fee payer", () => {
    const fee: TransactionHistoryEntryFee = {
      amount: "21000000000000",
      payer: TEST_ADDRESS,
    };
    expect(extractFee(makeEntry({ fee }), TEST_ADDRESS, NATIVE_ASSET_INFO)).toEqual({
      fee: "21000000000000",
      formattedFee: "0.000021",
      feeTicker: "ETH",
    });
  });

  it("populates fee fields when fee.payer is missing (back-compat)", () => {
    const fee: TransactionHistoryEntryFee = { amount: "21000000000000" };
    expect(extractFee(makeEntry({ fee }), TEST_ADDRESS, NATIVE_ASSET_INFO)).toEqual({
      fee: "21000000000000",
      formattedFee: "0.000021",
      feeTicker: "ETH",
    });
  });
});

describe("buildTransactionHistoryItem", () => {
  it("composes a fully-shaped TransactionHistoryItem for a native sent transfer", () => {
    const entry = makeEntry({
      hash: "0xsent",
      senders: [TEST_ADDRESS],
      recipients: ["0xrecipient"],
      value: "500000000000000000",
      timestamp: "2024-01-15T10:00:00Z",
      blockHeight: 19_000_001,
    });

    const item = buildTransactionHistoryItem({
      entry,
      normalizedAddress: TEST_ADDRESS,
      assetInfo: NATIVE_ASSET_INFO,
      nativeAssetInfo: NATIVE_ASSET_INFO,
      transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
    });

    expect(item).toMatchObject({
      hash: "0xsent",
      type: "sent",
      direction: "sent",
      kind: "transfer",
      status: "confirmed",
      value: "500000000000000000",
      formattedValue: "0.5",
      currencyName: "Ethereum",
      ticker: "ETH",
      timestamp: "2024-01-15T10:00:00Z",
      blockHeight: 19_000_001,
      ledgerId: "ethereum",
      explorerUrl: "https://etherscan.io/tx/0xsent",
    });
  });

  it("formats value using the ERC20 asset info for token transfers", () => {
    const entry = makeEntry({
      hash: "0xtoken",
      senders: [TEST_ADDRESS],
      recipients: ["0xrouter"],
      value: "5000000",
      asset: { isNative: false, contractAddress: "0xcontract" },
    });

    const item = buildTransactionHistoryItem({
      entry,
      normalizedAddress: TEST_ADDRESS,
      assetInfo: ERC20_ASSET_INFO,
      nativeAssetInfo: NATIVE_ASSET_INFO,
      transactionExplorerUrlTemplate: undefined,
    });

    expect(item).toMatchObject({
      value: "5000000",
      ticker: "USDC",
      currencyName: "USD Coin",
      ledgerId: "ethereum/erc20/usdc",
      formattedValue: "5",
    });
  });

  it("includes fee fields when the user is the fee payer", () => {
    const fee: TransactionHistoryEntryFee = {
      amount: "21000000000000",
      payer: TEST_ADDRESS,
    };
    const entry = makeEntry({
      senders: [TEST_ADDRESS],
      recipients: ["0xrecipient"],
      value: "1000000000000000000",
      fee,
    });

    const item = buildTransactionHistoryItem({
      entry,
      normalizedAddress: TEST_ADDRESS,
      assetInfo: NATIVE_ASSET_INFO,
      nativeAssetInfo: NATIVE_ASSET_INFO,
      transactionExplorerUrlTemplate: undefined,
    });

    expect(item).toMatchObject({
      fee: "21000000000000",
      formattedFee: "0.000021",
      feeTicker: "ETH",
    });
  });

  it("omits fee fields when fee.payer is someone else", () => {
    const fee: TransactionHistoryEntryFee = {
      amount: "21000000000000",
      payer: "0xothersponsor",
    };
    const entry = makeEntry({
      senders: ["0xsender"],
      recipients: [TEST_ADDRESS],
      direction: "received",
      value: "1",
      fee,
    });

    const item = buildTransactionHistoryItem({
      entry,
      normalizedAddress: TEST_ADDRESS,
      assetInfo: NATIVE_ASSET_INFO,
      nativeAssetInfo: NATIVE_ASSET_INFO,
      transactionExplorerUrlTemplate: undefined,
    });

    expect(item.fee).toBeUndefined();
    expect(item.formattedFee).toBeUndefined();
    expect(item.feeTicker).toBeUndefined();
  });

  it("leaves explorerUrl undefined when the template is undefined", () => {
    const entry = makeEntry({
      hash: "0xabc",
      senders: [TEST_ADDRESS],
      value: "1",
    });

    const item = buildTransactionHistoryItem({
      entry,
      normalizedAddress: TEST_ADDRESS,
      assetInfo: NATIVE_ASSET_INFO,
      nativeAssetInfo: NATIVE_ASSET_INFO,
      transactionExplorerUrlTemplate: undefined,
    });

    expect(item.explorerUrl).toBeUndefined();
  });

  it("marks failed entries as 'failed' and kind 'fees' when isFeeOnlyOperation=true", () => {
    const entry = makeEntry({
      hash: "0xfailed",
      senders: [TEST_ADDRESS],
      failed: true,
      isFeeOnlyOperation: true,
      fee: { amount: "100", payer: TEST_ADDRESS },
      value: "0",
    });

    const item = buildTransactionHistoryItem({
      entry,
      normalizedAddress: TEST_ADDRESS,
      assetInfo: NATIVE_ASSET_INFO,
      nativeAssetInfo: NATIVE_ASSET_INFO,
      transactionExplorerUrlTemplate: undefined,
    });

    expect(item).toMatchObject({
      hash: "0xfailed",
      status: "failed",
      kind: "fees",
      direction: "sent",
      type: "sent",
    });
  });
});
