import { decode, encode } from "ripple-binary-codec";
import { describe, expect, it } from "vitest";

import {
  assembleSignedTransaction,
  computeTransactionHash,
  serializeForDevice,
  withSigningFields,
} from "./xrpTransaction";

// A validated mainnet Payment, so the hash is a real transaction ID.
const MAINNET_PAYMENT = {
  TransactionType: "Payment",
  Account: "rKY9CXPdpnkQxQ9N86wcBYz7cFxcXfUG8Y",
  Destination: "rQruxtzFbPR2JgBp47FEbh4pAyYDStcLJH",
  Amount: "1600000000",
  Fee: "10",
  Flags: 2147483648,
  Sequence: 76747029,
  LastLedgerSequence: 107631035,
  SigningPubKey:
    "03430CE12840C76B40F778C7900DC706CEDAF6073947A1437179EF8BD402F871AF",
  TxnSignature:
    "3045022100C2E1D94FFE9447177716BAFCF88B049558C82DEC54617198E2E532AF7EFBAFE902207AE6D373C133C89355E4546D3AA9884DCA6DF8639E2B21B936C4D0633F8BF4E4",
};
const MAINNET_PAYMENT_HASH =
  "1EBF404FEFEEF0ACE02B696C35CBDB051BFE45A5004B9A9A685445F62430452A";

const { TxnSignature, ...UNSIGNED_PAYMENT } = MAINNET_PAYMENT;

function hexToBytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g) ?? [], (byte) =>
    Number.parseInt(byte, 16),
  );
}

describe("xrpTransaction", () => {
  describe("computeTransactionHash", () => {
    it("derives the transaction ID of a signed blob", async () => {
      const hash = await computeTransactionHash(encode(MAINNET_PAYMENT));

      expect(hash).toBe(MAINNET_PAYMENT_HASH);
    });
  });

  describe("withSigningFields", () => {
    it("sets Account and an upper-case SigningPubKey", () => {
      const tx = withSigningFields(
        { TransactionType: "Payment", Account: "rWrong" },
        "rRight",
        "abcd",
      );

      expect(tx).toMatchObject({ Account: "rRight", SigningPubKey: "ABCD" });
    });
  });

  describe("serializeForDevice", () => {
    it("encodes the transaction without the signing prefix", () => {
      const bytes = serializeForDevice(UNSIGNED_PAYMENT);

      expect(decode(Buffer.from(bytes).toString("hex"))).toEqual(
        UNSIGNED_PAYMENT,
      );
    });
  });

  describe("assembleSignedTransaction", () => {
    it("puts the DER signature in TxnSignature and returns the transaction ID", async () => {
      const signed = await assembleSignedTransaction(
        UNSIGNED_PAYMENT,
        hexToBytes(TxnSignature),
      );

      expect(signed.signature).toBe(TxnSignature);
      expect(signed.tx_blob).toBe(encode(MAINNET_PAYMENT));
      expect(signed.hash).toBe(MAINNET_PAYMENT_HASH);
    });
  });

  describe("serializeForDevice errors", () => {
    it.each([
      ["NaN", Number.NaN],
      ["a float", 5.5],
      ["null", null],
    ])("names the field when LastLedgerSequence is %s", (_, value) => {
      const tx = withSigningFields(
        { ...UNSIGNED_PAYMENT, LastLedgerSequence: value },
        MAINNET_PAYMENT.Account,
        MAINNET_PAYMENT.SigningPubKey,
      );

      expect(() => serializeForDevice(tx)).toThrow(
        /Invalid XRP transaction field "LastLedgerSequence"/,
      );
    });

    it("keeps the original error when no numeric field is invalid", () => {
      const tx = withSigningFields(
        { ...UNSIGNED_PAYMENT, TransactionType: "NotAType" },
        MAINNET_PAYMENT.Account,
        MAINNET_PAYMENT.SigningPubKey,
      );

      expect(() => serializeForDevice(tx)).toThrow();
      expect(() => serializeForDevice(tx)).not.toThrow(
        /Invalid XRP transaction field/,
      );
    });
  });
});
