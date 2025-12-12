import { bufferToHexaString } from "@ledgerhq/device-management-kit";
import { sha256 } from "ethers";

import { EventDataSchema } from "../../schemas/event-schemas.js";
import {
  type ConsentGivenEventData,
  type ConsentRemovedEventData,
  type EventRequest,
  EventType,
  type InvoicingTransactionSignedEventData,
  type LedgerSyncActivatedEventData,
  type OnboardingEventData,
  type OpenLedgerSyncEventData,
  type OpenSessionEventData,
  type SessionAuthenticationEventData,
  type TransactionFlowCompletionEventData,
  type TransactionFlowInitializationEventData,
  TypedMessageFlowCompletionEventData,
  type TypedMessageFlowInitializationEventData,
} from "../backend/model/trackEvent.js";
import { generateUUID } from "./utils.js";

export function normalizeTransactionHash(hash: string): string {
  return hash.toLowerCase().replace(/^0x/, "");
}

interface BaseEventParams {
  dAppId: string;
}

interface SessionEventParams extends BaseEventParams {
  sessionId: string;
}

interface TransactionEventParams extends SessionEventParams {
  unsignedTransactionHash: string;
  chainId: string | null;
}

export function stringToSha256(string: string): string {
  const bytes = new TextEncoder().encode(string);
  const hexString = bufferToHexaString(bytes);
  return sha256(hexString);
}

export class EventTrackingUtils {
  static validateEvent(event: EventRequest): {
    success: boolean;
    errors?: Array<{ path: string; message: string }>;
  } {
    const result = EventDataSchema.safeParse(event.data);

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  static createOpenSessionEvent(params: SessionEventParams): EventRequest {
    const data: OpenSessionEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.OpenSession,
      session_id: params.sessionId,
    };

    return {
      name: EventType.OpenSession,
      type: EventType.OpenSession,
      data,
    };
  }

  static createOpenLedgerSyncEvent(params: SessionEventParams): EventRequest {
    const data: OpenLedgerSyncEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.OpenLedgerSync,
      session_id: params.sessionId,
    };

    return {
      name: EventType.OpenLedgerSync,
      type: EventType.OpenLedgerSync,
      data,
    };
  }

  static createLedgerSyncActivatedEvent(
    params: SessionEventParams,
  ): EventRequest {
    const data: LedgerSyncActivatedEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.LedgerSyncActivated,
      session_id: params.sessionId,
    };

    return {
      name: EventType.LedgerSyncActivated,
      type: EventType.LedgerSyncActivated,
      data,
    };
  }

  static createConsentGivenEvent(params: SessionEventParams): EventRequest {
    const data: ConsentGivenEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.ConsentGiven,
    };

    return {
      name: EventType.ConsentGiven,
      type: EventType.ConsentGiven,
      data,
    };
  }

  static createConsentRemovedEvent(params: SessionEventParams): EventRequest {
    const data: ConsentRemovedEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.ConsentRemoved,
    };

    return {
      name: EventType.ConsentRemoved,
      type: EventType.ConsentRemoved,
      data,
    };
  }

  static createOnboardingEvent(
    params: SessionEventParams & {
      accountCurrency: string;
      accountBalance: string;
      chainId: string | null;
    },
  ): EventRequest {
    const data: OnboardingEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.Onboarding,
      session_id: params.sessionId,
      blockchain_network_selected: "ethereum",
      chain_id: params.chainId,
      account_currency: params.accountCurrency,
      account_balance: params.accountBalance,
    };

    return {
      name: EventType.Onboarding,
      type: EventType.Onboarding,
      data,
    };
  }

  static createTransactionFlowInitializationEvent(
    params: TransactionEventParams,
  ): EventRequest {
    const data: TransactionFlowInitializationEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.TransactionFlowInitialization,
      session_id: params.sessionId,
      blockchain_network_selected: "ethereum",
      unsigned_transaction_hash: normalizeTransactionHash(
        params.unsignedTransactionHash,
      ),
      chain_id: params.chainId,
    };

    return {
      name: EventType.TransactionFlowInitialization,
      type: EventType.TransactionFlowInitialization,
      data,
    };
  }

  static createTransactionFlowCompletionEvent(
    params: TransactionEventParams & { transactionHash: string },
  ): EventRequest {
    const data: TransactionFlowCompletionEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.TransactionFlowCompletion,
      session_id: params.sessionId,
      blockchain_network_selected: "ethereum",
      transaction_hash: normalizeTransactionHash(params.transactionHash),
      unsigned_transaction_hash: normalizeTransactionHash(
        params.unsignedTransactionHash,
      ),
      chain_id: params.chainId,
    };

    return {
      name: EventType.TransactionFlowCompletion,
      type: EventType.TransactionFlowCompletion,
      data,
    };
  }

  static createSessionAuthenticationEvent(
    params: TransactionEventParams & { transactionHash: string },
  ): EventRequest {
    const data: SessionAuthenticationEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.SessionAuthentication,
      session_id: params.sessionId,
      blockchain_network_selected: "ethereum",
      unsigned_transaction_hash: normalizeTransactionHash(
        params.unsignedTransactionHash,
      ),
      transaction_type: "authentication_tx",
      transaction_hash: normalizeTransactionHash(params.transactionHash),
    };

    return {
      name: EventType.SessionAuthentication,
      type: EventType.SessionAuthentication,
      data,
    };
  }

  static createInvoicingTransactionSignedEvent(
    params: SessionEventParams & {
      transactionHash: string;
      unsignedTransactionHash: string;
      chainId: string | null;
      recipientAddress: string;
    },
  ): EventRequest {
    const data: InvoicingTransactionSignedEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.InvoicingTransactionSigned,
      blockchain_network_selected: "ethereum",
      chain_id: params.chainId,
      transaction_hash: normalizeTransactionHash(params.transactionHash),
      recipient_address: params.recipientAddress.toLowerCase(),
      unsigned_transaction_hash: normalizeTransactionHash(
        params.unsignedTransactionHash,
      ),
    };

    return {
      name: EventType.InvoicingTransactionSigned,
      type: EventType.InvoicingTransactionSigned,
      data,
    };
  }

  static createTypedMessageFlowInitializationEvent(params: {
    dAppId: string;
    sessionId: string;
    typedMessageHash: string;
    chainId: string;
  }): EventRequest {
    const data: TypedMessageFlowInitializationEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.TypedMessageFlowInitialization,
      session_id: params.sessionId,
      blockchain_network_selected: "ethereum",
      chain_id: params.chainId,
      typed_message_hash: normalizeTransactionHash(params.typedMessageHash),
    };

    return {
      name: EventType.TypedMessageFlowInitialization,
      type: EventType.TypedMessageFlowInitialization,
      data,
    };
  }

  static createTypedMessageFlowCompletionEvent(params: {
    dAppId: string;
    sessionId: string;
    typedMessageHash: string;
    chainId: string;
  }): EventRequest {
    const data: TypedMessageFlowCompletionEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.TypedMessageFlowCompletion,
      session_id: params.sessionId,
      blockchain_network_selected: "ethereum",
      chain_id: params.chainId,
      typed_message_hash: normalizeTransactionHash(params.typedMessageHash),
    };

    return {
      name: EventType.TypedMessageFlowCompletion,
      type: EventType.TypedMessageFlowCompletion,
      data,
    };
  }
}
