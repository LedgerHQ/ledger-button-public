import { describe, expect, it } from "vitest";

import type {
  InvoicingTransactionSignedEventData,
  MobileRedirectLedgerWalletEventData,
} from "../backend/model/trackEvent.js";
import { EventType } from "../backend/model/trackEvent.js";
import { EventTrackingUtils } from "./EventTrackingUtils.js";

describe("EventTrackingUtils", () => {
  describe("validateEvent", () => {
    it("should validate a correctly formatted invoicing event", () => {
      const event = EventTrackingUtils.createInvoicingTransactionSignedEvent({
        dAppId: "test-dapp",
        sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        transactionHash:
          "0xcaf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        recipientAddress: "0x111111125421cA6dc452d289314280a0f8842A65",
        chainId: "1",
        unsignedTransactionHash: "0x02f90552017a8427e021408427e021408304c04c",
      });

      const result = EventTrackingUtils.validateEvent(event);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should validate a correctly formatted mobile redirect event", () => {
      const event =
        EventTrackingUtils.createMobileRedirectLedgerWalletEvent({
          dAppId: "test-dapp",
        });

      const result = EventTrackingUtils.validateEvent(event);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should validate a correctly formatted view transaction details clicked event", () => {
      const event =
        EventTrackingUtils.createViewTransactionDetailsClickedEvent({
          dAppId: "test-dapp",
          sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
          chainId: "1",
          transactionHash:
            "0xcaf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        });

      const result = EventTrackingUtils.validateEvent(event);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should validate a correctly formatted view all transactions clicked event", () => {
      const event = EventTrackingUtils.createViewAllTransactionsClickedEvent({
        dAppId: "test-dapp",
        sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        currencyId: "ethereum",
        accountAddress: "0xC5C0D8123456789012345678901234567890C0D8",
      });

      const result = EventTrackingUtils.validateEvent(event);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(
        (event.data as { account_address: string }).account_address,
      ).toBe("0xc5c0d8123456789012345678901234567890c0d8");
    });

    it("should validate a correctly formatted view all transactions redirect confirmed event", () => {
      const event =
        EventTrackingUtils.createViewAllTransactionsRedirectConfirmedEvent({
          dAppId: "test-dapp",
          sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
          currencyId: "ethereum",
          accountAddress: "0xC5C0D8123456789012345678901234567890C0D8",
        });

      const result = EventTrackingUtils.validateEvent(event);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(
        (event.data as { account_address: string }).account_address,
      ).toBe("0xc5c0d8123456789012345678901234567890c0d8");
    });

    it("should validate a correctly formatted view all transactions redirect cancelled event", () => {
      const event =
        EventTrackingUtils.createViewAllTransactionsRedirectCancelledEvent({
          dAppId: "test-dapp",
          sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
          currencyId: "ethereum",
          accountAddress: "0xC5C0D8123456789012345678901234567890C0D8",
        });

      const result = EventTrackingUtils.validateEvent(event);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(
        (event.data as { account_address: string }).account_address,
      ).toBe("0xc5c0d8123456789012345678901234567890c0d8");
    });

    it("should validate a correctly formatted language_changed event", () => {
      const event = EventTrackingUtils.createLanguageChangedEvent({
        dAppId: "test-dapp",
        sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        languageKey: "en",
      });

      const result = EventTrackingUtils.validateEvent(event);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should normalize the transaction_hash on the view-details click event", () => {
      const event =
        EventTrackingUtils.createViewTransactionDetailsClickedEvent({
          dAppId: "test-dapp",
          sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
          chainId: "1",
          transactionHash:
            "0xCAF172BF3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        });

      expect(
        (event.data as { transaction_hash: string }).transaction_hash,
      ).toBe(
        "caf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
      );
    });

    it("should validate a correctly formatted currency_changed event", () => {
      const event = EventTrackingUtils.createCurrencyChangedEvent({
        dAppId: "test-dapp",
        sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        currencyCode: "eur",
      });

      const result = EventTrackingUtils.validateEvent(event);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should return detailed errors for an invalid event", () => {
      const event = EventTrackingUtils.createInvoicingTransactionSignedEvent({
        dAppId: "test-dapp",
        sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        transactionHash:
          "0xcaf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        recipientAddress: "0x111111125421cA6dc452d289314280a0f8842A65",
        chainId: "1",
        unsignedTransactionHash: "0x02f90552017a8427e021408427e021408304c04c",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event.data as any).event_id = "not-a-valid-uuid";

      const result = EventTrackingUtils.validateEvent(event);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0].path).toBe("event_id");
    });
  });

  describe("normalizeTransactionHash", () => {
    it("should normalize transaction hashes by removing 0x prefix", () => {
      const event = EventTrackingUtils.createInvoicingTransactionSignedEvent({
        dAppId: "test-dapp",
        sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        transactionHash:
          "0xCAF172BF3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        recipientAddress: "0x111111125421cA6dc452d289314280a0f8842A65",
        chainId: "1",
        unsignedTransactionHash: "0x02f90552017a8427e021408427e021408304c04c",
      });

      const data = event.data as InvoicingTransactionSignedEventData;
      expect(data.transaction_hash).toBe(
        "caf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
      );
      expect(data.unsigned_transaction_hash).toBe(
        "02f90552017a8427e021408427e021408304c04c",
      );
    });

    it("should normalize recipient address to lowercase", () => {
      const event = EventTrackingUtils.createInvoicingTransactionSignedEvent({
        dAppId: "test-dapp",
        sessionId: "a93f987c-11df-40d7-abe7-cfd2c7be92a2",
        transactionHash:
          "0xcaf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
        recipientAddress: "0X111111125421CA6DC452D289314280A0F8842A65",
        unsignedTransactionHash: "0x02f90552017a8427e021408427e021408304c04c",
        chainId: "1",
      });

      const data = event.data as InvoicingTransactionSignedEventData;
      expect(data.recipient_address).toBe(
        "0x111111125421ca6dc452d289314280a0f8842a65",
      );
    });
  });

  describe("createMobileRedirectLedgerWalletEvent", () => {
    it("should create event with correct name and type", () => {
      const event =
        EventTrackingUtils.createMobileRedirectLedgerWalletEvent({
          dAppId: "test-dapp",
        });

      expect(event.name).toBe("Mobile Redirect Ledger Wallet");
      expect(event.type).toBe(EventType.MobileRedirectLedgerWallet);
    });

    it("should populate base event data fields", () => {
      const event =
        EventTrackingUtils.createMobileRedirectLedgerWalletEvent({
          dAppId: "my-dapp",
        });

      const data = event.data as MobileRedirectLedgerWalletEventData;
      expect(data.event_type).toBe("mobile_redirect_ledger_wallet");
      expect(data.transaction_dapp_id).toBe("my-dapp");
      expect(data.event_id).toBeDefined();
      expect(data.timestamp_ms).toBeGreaterThan(0);
    });

    it("should generate a valid UUID for event_id", () => {
      const event =
        EventTrackingUtils.createMobileRedirectLedgerWalletEvent({
          dAppId: "test-dapp",
        });

      const data = event.data as MobileRedirectLedgerWalletEventData;
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      expect(data.event_id).toMatch(uuidPattern);
    });
  });
});
