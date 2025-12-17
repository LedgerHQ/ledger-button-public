import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ButtonCoreContext } from "../../../api/model/ButtonCoreContext.js";
import type { BackendService } from "../../backend/BackendService.js";
import type { EventRequest } from "../../backend/model/trackEvent.js";
import { EventType } from "../../backend/model/trackEvent.js";
import type { Config } from "../../config/model/config.js";
import type { ContextService } from "../../context/ContextService.js";
import { DefaultEventTrackingService } from "./DefaultEventTrackingService.js";

describe("DefaultEventTrackingService", () => {
  let eventTrackingService: DefaultEventTrackingService;
  let mockBackendService: {
    event: ReturnType<typeof vi.fn>;
  };
  let mockConfig: {
    dAppIdentifier: string;
  };
  let mockLogger: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let mockLoggerFactory: ReturnType<typeof vi.fn>;
  let mockContextService: {
    getContext: ReturnType<typeof vi.fn>;
    observeContext: ReturnType<typeof vi.fn>;
    onEvent: ReturnType<typeof vi.fn>;
  };

  const createMockContext = (
    overrides: Partial<ButtonCoreContext> = {},
  ): ButtonCoreContext => ({
    connectedDevice: undefined,
    selectedAccount: undefined,
    trustChainId: undefined,
    applicationPath: undefined,
    chainId: 1,
    welcomeScreenCompleted: false,
    hasTrackingConsent: false,
    ...overrides,
  });

  const createMockEvent = (
    type: EventType,
    eventType: string,
  ): EventRequest => ({
    name: "Test Event",
    type,
    data: {
      event_type: eventType,
      event_id: "test-id",
      transaction_dapp_id: "test-dapp",
      timestamp_ms: Date.now(),
    } as EventRequest["data"],
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockBackendService = {
      event: vi.fn().mockResolvedValue(Right({ success: true })),
    };

    mockConfig = {
      dAppIdentifier: "test-dapp",
    };

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    mockLoggerFactory = vi.fn().mockReturnValue(mockLogger);

    mockContextService = {
      getContext: vi.fn().mockReturnValue(createMockContext()),
      observeContext: vi.fn(),
      onEvent: vi.fn(),
    };

    eventTrackingService = new DefaultEventTrackingService(
      mockBackendService as unknown as BackendService,
      mockConfig as unknown as Config,
      mockLoggerFactory,
      mockContextService as unknown as ContextService,
    );
  });

  describe("getSessionId", () => {
    it("should return a session ID", () => {
      const sessionId = eventTrackingService.getSessionId();
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      expect(sessionId).toMatch(uuidPattern);
    });
  });

  describe("trackEvent", () => {
    describe("billing events (InvoicingTransactionSigned)", () => {
      it("should ALWAYS track InvoicingTransactionSigned even without consent", async () => {
        mockContextService.getContext.mockReturnValue(
          createMockContext({ hasTrackingConsent: false }),
        );

        const event = createMockEvent(
          EventType.InvoicingTransactionSigned,
          "invoicing_transaction_signed",
        );

        await eventTrackingService.trackEvent(event);

        expect(mockBackendService.event).toHaveBeenCalledWith(
          event,
          mockConfig.dAppIdentifier,
        );
        expect(mockLogger.debug).not.toHaveBeenCalledWith(
          "User has not given consent, skipping tracking",
          expect.anything(),
        );
      });

      it("should track InvoicingTransactionSigned with consent", async () => {
        mockContextService.getContext.mockReturnValue(
          createMockContext({ hasTrackingConsent: true }),
        );

        const event = createMockEvent(
          EventType.InvoicingTransactionSigned,
          "invoicing_transaction_signed",
        );

        await eventTrackingService.trackEvent(event);

        expect(mockBackendService.event).toHaveBeenCalledWith(
          event,
          mockConfig.dAppIdentifier,
        );
      });
    });

    describe("analytics events (consent-based)", () => {
      it("should NOT track analytics events when user has not given consent", async () => {
        mockContextService.getContext.mockReturnValue(
          createMockContext({ hasTrackingConsent: false }),
        );

        const event = createMockEvent(EventType.ConsentGiven, "consent_given");

        await eventTrackingService.trackEvent(event);

        expect(mockBackendService.event).not.toHaveBeenCalled();
        expect(mockLogger.debug).toHaveBeenCalledWith(
          "User has not given consent, skipping tracking",
          { event },
        );
      });

      it("should track analytics events when user has given consent", async () => {
        mockContextService.getContext.mockReturnValue(
          createMockContext({ hasTrackingConsent: true }),
        );

        const event = createMockEvent(EventType.ConsentGiven, "consent_given");

        await eventTrackingService.trackEvent(event);

        expect(mockBackendService.event).toHaveBeenCalledWith(
          event,
          mockConfig.dAppIdentifier,
        );
      });

      it("should track TypedMessageFlowInitialization when consent is given", async () => {
        mockContextService.getContext.mockReturnValue(
          createMockContext({ hasTrackingConsent: true }),
        );

        const event = createMockEvent(
          EventType.TypedMessageFlowInitialization,
          "typed_message_flow_initialization",
        );

        await eventTrackingService.trackEvent(event);

        expect(mockBackendService.event).toHaveBeenCalledWith(
          event,
          mockConfig.dAppIdentifier,
        );
      });

      it("should track TransactionFlowInitialization when consent is given", async () => {
        mockContextService.getContext.mockReturnValue(
          createMockContext({ hasTrackingConsent: true }),
        );

        const event = createMockEvent(
          EventType.TransactionFlowInitialization,
          "transaction_flow_initialization",
        );

        await eventTrackingService.trackEvent(event);

        expect(mockBackendService.event).toHaveBeenCalledWith(
          event,
          mockConfig.dAppIdentifier,
        );
      });
    });

    describe("error handling", () => {
      it("should handle backend errors gracefully", async () => {
        mockContextService.getContext.mockReturnValue(
          createMockContext({ hasTrackingConsent: true }),
        );
        mockBackendService.event.mockResolvedValue(
          Left(new Error("Backend error")),
        );

        const event = createMockEvent(
          EventType.InvoicingTransactionSigned,
          "invoicing_transaction_signed",
        );

        await eventTrackingService.trackEvent(event);

        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to track event",
          expect.objectContaining({ event }),
        );
      });

      it("should handle exceptions gracefully", async () => {
        mockContextService.getContext.mockReturnValue(
          createMockContext({ hasTrackingConsent: true }),
        );
        mockBackendService.event.mockRejectedValue(new Error("Network error"));

        const event = createMockEvent(
          EventType.InvoicingTransactionSigned,
          "invoicing_transaction_signed",
        );

        await eventTrackingService.trackEvent(event);

        expect(mockLogger.error).toHaveBeenCalledWith(
          "Error tracking event",
          expect.objectContaining({ event }),
        );
      });

      it("should log success when event is tracked successfully", async () => {
        mockContextService.getContext.mockReturnValue(
          createMockContext({ hasTrackingConsent: true }),
        );
        mockBackendService.event.mockResolvedValue(Right({ success: true }));

        const event = createMockEvent(
          EventType.InvoicingTransactionSigned,
          "invoicing_transaction_signed",
        );

        await eventTrackingService.trackEvent(event);

        expect(mockLogger.debug).toHaveBeenCalledWith(
          "Event tracked successfully",
          expect.objectContaining({ response: { success: true } }),
        );
      });
    });
  });
});
