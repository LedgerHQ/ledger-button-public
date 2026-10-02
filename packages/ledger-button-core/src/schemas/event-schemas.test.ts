import { describe, expect, it } from "vitest";

import {
  InvoicingTransactionSignedEventSchema,
  MobileRedirectLedgerWalletEventSchema,
  TransactionFlowCompletionEventSchema,
  ViewAllTransactionsClickedEventSchema,
  ViewAllTransactionsRedirectCancelledEventSchema,
  ViewAllTransactionsRedirectConfirmedEventSchema,
  ViewTransactionDetailsClickedEventSchema,
} from "./event-schemas";

describe("Event Schema Validation", () => {
  describe("InvoicingTransactionSignedEventSchema", () => {
    it("should validate a correct invoicing event", () => {
      const validEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918630007,
        event_type: "invoicing_transaction_signed",
        blockchain_network_selected: "ethereum",
        chain_id: "1",
        transaction_hash:
          "caf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        recipient_address: "0x111111125421ca6dc452d289314280a0f8842a65",
        unsigned_transaction_hash: "02f90552017a8427e021408427e021408304c04c",
      };

      const result =
        InvoicingTransactionSignedEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should accept a null chain_id", () => {
      const validEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918630007,
        event_type: "invoicing_transaction_signed",
        blockchain_network_selected: "ethereum",
        chain_id: null,
        transaction_hash:
          "caf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        recipient_address: "0x111111125421ca6dc452d289314280a0f8842a65",
        unsigned_transaction_hash: "02f90552017a8427e021408427e021408304c04c",
      };

      const result =
        InvoicingTransactionSignedEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should reject transaction_hash with 0x prefix", () => {
      const invalidEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918630007,
        event_type: "invoicing_transaction_signed",
        blockchain_network_selected: "ethereum",
        chain_id: "1",
        transaction_hash:
          "0xcaf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        recipient_address: "0x111111125421ca6dc452d289314280a0f8842a65",
        unsigned_transaction_hash: "02f90552017a8427e021408427e021408304c04c",
      };

      const result =
        InvoicingTransactionSignedEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) =>
            issue.path.includes("transaction_hash"),
          ),
        ).toBe(true);
      }
    });

    describe("solana", () => {
      const aSolanaInvoicingEvent = (transactionHash: string) => ({
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "jupiter",
        timestamp_ms: 1759918630007,
        event_type: "invoicing_transaction_signed",
        blockchain_network_selected: "solana",
        chain_id: "mainnet",
        transaction_hash: transactionHash,
        recipient_address: "",
        unsigned_transaction_hash: "02f90552017a8427e021408427e021408304c04c",
      });

      it("should accept a base58 transaction_hash", () => {
        const result = InvoicingTransactionSignedEventSchema.safeParse(
          aSolanaInvoicingEvent(
            "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW",
          ),
        );
        expect(result.success).toBe(true);
      });

      it("should reject a transaction_hash that is not base58", () => {
        const result = InvoicingTransactionSignedEventSchema.safeParse(
          aSolanaInvoicingEvent(
            "0xcaf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
          ),
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]).toMatchObject({
            path: ["transaction_hash"],
            message: "Transaction hash must be a base58 signature",
          });
        }
      });
    });

    it("should reject invalid event_id format", () => {
      const invalidEvent = {
        event_id: "not-a-uuid",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918630007,
        event_type: "invoicing_transaction_signed",
        blockchain_network_selected: "ethereum",
        chain_id: "1",
        transaction_hash:
          "caf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        recipient_address: "0x111111125421ca6dc452d289314280a0f8842a65",
        unsigned_transaction_hash: "02f90552017a8427e021408427e021408304c04c",
      };

      const result =
        InvoicingTransactionSignedEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should reject extra fields", () => {
      const invalidEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918630007,
        event_type: "invoicing_transaction_signed",
        blockchain_network_selected: "ethereum",
        chain_id: "1",
        transaction_hash:
          "caf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        recipient_address: "0x111111125421ca6dc452d289314280a0f8842a65",
        unsigned_transaction_hash: "02f90552017a8427e021408427e021408304c04c",
        unknown_extra_field: "should not be allowed",
      };

      const result =
        InvoicingTransactionSignedEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe("TransactionFlowCompletionEventSchema", () => {
    it("should validate a correct transaction flow completion event", () => {
      const validEvent = {
        event_id: "5301b8e6-4e06-4ce0-83a0-15ef70f6c514",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918628839,
        event_type: "transaction_flow_completion",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        blockchain_network_selected: "ethereum",
        chain_id: "1",
      };

      const result = TransactionFlowCompletionEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should accept the solana family", () => {
      const validEvent = {
        event_id: "5301b8e6-4e06-4ce0-83a0-15ef70f6c514",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918628839,
        event_type: "transaction_flow_completion",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        blockchain_network_selected: "solana",
        chain_id: "mainnet",
      };

      const result = TransactionFlowCompletionEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should reject an unknown blockchain family", () => {
      const invalidEvent = {
        event_id: "5301b8e6-4e06-4ce0-83a0-15ef70f6c514",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918628839,
        event_type: "transaction_flow_completion",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        blockchain_network_selected: "bitcoin",
        chain_id: "1",
      };

      const result =
        TransactionFlowCompletionEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should accept a null chain_id", () => {
      const validEvent = {
        event_id: "5301b8e6-4e06-4ce0-83a0-15ef70f6c514",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918628839,
        event_type: "transaction_flow_completion",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        blockchain_network_selected: "ethereum",
        chain_id: null,
      };

      const result = TransactionFlowCompletionEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should reject an invalid session_id format", () => {
      const invalidEvent = {
        event_id: "5301b8e6-4e06-4ce0-83a0-15ef70f6c514",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918628839,
        event_type: "transaction_flow_completion",
        session_id: "not-a-uuid",
        blockchain_network_selected: "ethereum",
        chain_id: "1",
      };

      const result =
        TransactionFlowCompletionEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) =>
            issue.path.includes("session_id"),
          ),
        ).toBe(true);
      }
    });

    it("should reject extra fields", () => {
      const invalidEvent = {
        event_id: "5301b8e6-4e06-4ce0-83a0-15ef70f6c514",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1759918628839,
        event_type: "transaction_flow_completion",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        blockchain_network_selected: "ethereum",
        chain_id: "1",
        unsigned_transaction_hash: "02f90552017a8427e021408427e021408304c04c",
      };

      const result =
        TransactionFlowCompletionEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe("MobileRedirectLedgerWalletEventSchema", () => {
    it("should validate a correct mobile redirect event", () => {
      const validEvent = {
        event_id: "e7a32965-2f76-4167-bdf2-302fdbc5eb68",
        transaction_dapp_id: "1Inch",
        timestamp_ms: 1770980790515,
        event_type: "mobile_redirect_ledger_wallet",
      };

      const result =
        MobileRedirectLedgerWalletEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should reject an invalid event_id format", () => {
      const invalidEvent = {
        event_id: "not-a-uuid",
        transaction_dapp_id: "1Inch",
        timestamp_ms: 1770980790515,
        event_type: "mobile_redirect_ledger_wallet",
      };

      const result =
        MobileRedirectLedgerWalletEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should reject a wrong event_type", () => {
      const invalidEvent = {
        event_id: "e7a32965-2f76-4167-bdf2-302fdbc5eb68",
        transaction_dapp_id: "1Inch",
        timestamp_ms: 1770980790515,
        event_type: "wrong_event_type",
      };

      const result =
        MobileRedirectLedgerWalletEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe("ViewTransactionDetailsClickedEventSchema", () => {
    it("validates a correctly formatted event", () => {
      const validEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1770980790515,
        event_type: "view_transaction_details_clicked",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        blockchain_network_selected: "ethereum",
        chain_id: "1",
        transaction_hash:
          "caf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
      };

      const result =
        ViewTransactionDetailsClickedEventSchema.safeParse(validEvent);

      expect(result.success).toBe(true);
    });

    it("rejects transaction_hash with 0x prefix", () => {
      const invalidEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1770980790515,
        event_type: "view_transaction_details_clicked",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        blockchain_network_selected: "ethereum",
        chain_id: "1",
        transaction_hash:
          "0xcaf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
      };

      const result =
        ViewTransactionDetailsClickedEventSchema.safeParse(invalidEvent);

      expect(result.success).toBe(false);
    });

    describe("solana", () => {
      const aSolanaViewDetailsEvent = (transactionHash: string) => ({
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "jupiter",
        timestamp_ms: 1770980790515,
        event_type: "view_transaction_details_clicked",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        blockchain_network_selected: "solana",
        chain_id: "mainnet",
        transaction_hash: transactionHash,
      });

      it("should accept a base58 transaction_hash", () => {
        const result = ViewTransactionDetailsClickedEventSchema.safeParse(
          aSolanaViewDetailsEvent(
            "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW",
          ),
        );
        expect(result.success).toBe(true);
      });

      it("should reject a transaction_hash that is not base58", () => {
        const result = ViewTransactionDetailsClickedEventSchema.safeParse(
          aSolanaViewDetailsEvent(
            "0xcaf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
          ),
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]).toMatchObject({
            path: ["transaction_hash"],
            message: "Transaction hash must be a base58 signature",
          });
        }
      });
    });

    it("accepts a null chain_id", () => {
      const validEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1770980790515,
        event_type: "view_transaction_details_clicked",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        blockchain_network_selected: "ethereum",
        chain_id: null,
        transaction_hash:
          "caf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
      };

      const result =
        ViewTransactionDetailsClickedEventSchema.safeParse(validEvent);

      expect(result.success).toBe(true);
    });
  });

  describe("ViewAllTransactionsClickedEventSchema", () => {
    it("validates a correctly formatted event", () => {
      const validEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1770980790515,
        event_type: "view_all_transactions_clicked",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        currency_id: "ethereum",
        account_address: "0xc5c0d8123456789012345678901234567890c0d8",
      };

      const result =
        ViewAllTransactionsClickedEventSchema.safeParse(validEvent);

      expect(result.success).toBe(true);
    });

    it("rejects missing currency_id", () => {
      const invalidEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1770980790515,
        event_type: "view_all_transactions_clicked",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        account_address: "0xc5c0d8123456789012345678901234567890c0d8",
      };

      const result =
        ViewAllTransactionsClickedEventSchema.safeParse(invalidEvent);

      expect(result.success).toBe(false);
    });
  });

  describe("ViewAllTransactionsRedirectConfirmedEventSchema", () => {
    it("validates a correctly formatted event", () => {
      const validEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1770980790515,
        event_type: "view_all_transactions_redirect_confirmed",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        currency_id: "ethereum",
        account_address: "0xc5c0d8123456789012345678901234567890c0d8",
      };

      const result =
        ViewAllTransactionsRedirectConfirmedEventSchema.safeParse(validEvent);

      expect(result.success).toBe(true);
    });

    it("rejects missing account_address", () => {
      const invalidEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1770980790515,
        event_type: "view_all_transactions_redirect_confirmed",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        currency_id: "ethereum",
      };

      const result =
        ViewAllTransactionsRedirectConfirmedEventSchema.safeParse(invalidEvent);

      expect(result.success).toBe(false);
    });
  });

  describe("ViewAllTransactionsRedirectCancelledEventSchema", () => {
    it("validates a correctly formatted event", () => {
      const validEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1770980790515,
        event_type: "view_all_transactions_redirect_cancelled",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        currency_id: "ethereum",
        account_address: "0xc5c0d8123456789012345678901234567890c0d8",
      };

      const result =
        ViewAllTransactionsRedirectCancelledEventSchema.safeParse(validEvent);

      expect(result.success).toBe(true);
    });

    it("rejects missing currency_id", () => {
      const invalidEvent = {
        event_id: "bf75cd86-c565-49e1-97ec-e16b6071be11",
        transaction_dapp_id: "1inch",
        timestamp_ms: 1770980790515,
        event_type: "view_all_transactions_redirect_cancelled",
        session_id: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        account_address: "0xc5c0d8123456789012345678901234567890c0d8",
      };

      const result =
        ViewAllTransactionsRedirectCancelledEventSchema.safeParse(invalidEvent);

      expect(result.success).toBe(false);
    });
  });
});
