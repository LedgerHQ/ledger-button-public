function generateUUID(): string {
  return crypto.randomUUID();
}

import {
  EventType,
  type ConsentGivenEventData,
  type ConsentRemovedEventData,
  type EventRequest,
  type InvoicingTransactionSignedEventData,
  type LedgerSyncActivatedEventData,
  type OnboardingEventData,
  type OpenLedgerSyncEventData,
  type OpenSessionEventData,
  type SessionAuthenticationEventData,
  type TransactionFlowCompletionEventData,
  type TransactionFlowInitializationEventData,
} from "../backend/types.js";

interface BaseEventParams {
  dAppId: string;
}

interface SessionEventParams extends BaseEventParams {
  sessionId: string;
}

interface LedgerSyncEventParams extends SessionEventParams {
  ledgerSyncUserId: string;
}

interface TransactionEventParams extends LedgerSyncEventParams {
  accountCurrency: string;
  accountBalance: string;
  unsignedTransactionHash: string;
  transactionType: "authentication_tx" | "standard_tx";
}

export class EventTrackingUtils {
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
    params: LedgerSyncEventParams,
  ): EventRequest {
    const data: LedgerSyncActivatedEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.LedgerSyncActivated,
      session_id: params.sessionId,
      ledger_sync_user_id: params.ledgerSyncUserId,
    };

    return {
      name: EventType.LedgerSyncActivated,
      type: EventType.LedgerSyncActivated,
      data,
    };
  }

  static createConsentGivenEvent(
    params: LedgerSyncEventParams,
  ): EventRequest {
    const data: ConsentGivenEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.ConsentGiven,
      ledger_sync_user_id: params.ledgerSyncUserId,
    };

    return {
      name: EventType.ConsentGiven,
      type: EventType.ConsentGiven,
      data,
    };
  }

  static createConsentRemovedEvent(
    params: LedgerSyncEventParams,
  ): EventRequest {
    const data: ConsentRemovedEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.ConsentRemoved,
      ledger_sync_user_id: params.ledgerSyncUserId,
    };

    return {
      name: EventType.ConsentRemoved,
      type: EventType.ConsentRemoved,
      data,
    };
  }

  static createOnboardingEvent(
    params: LedgerSyncEventParams & {
      accountCurrency: string;
      accountBalance: string;
    },
  ): EventRequest {
    const data: OnboardingEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.Onboarding,
      session_id: params.sessionId,
      ledger_sync_user_id: params.ledgerSyncUserId,
      blockchain_network_selected: "ethereum",
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
      ledger_sync_user_id: params.ledgerSyncUserId,
      blockchain_network_selected: "ethereum",
      account_currency: params.accountCurrency,
      account_balance: params.accountBalance,
      unsigned_transaction_hash: params.unsignedTransactionHash,
      transaction_type: params.transactionType,
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
      ledger_sync_user_id: params.ledgerSyncUserId,
      blockchain_network_selected: "ethereum",
      account_currency: params.accountCurrency,
      account_balance: params.accountBalance,
      unsigned_transaction_hash: params.unsignedTransactionHash,
      transaction_type: params.transactionType,
      transaction_hash: params.transactionHash,
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
      ledger_sync_user_id: params.ledgerSyncUserId,
      blockchain_network_selected: "ethereum",
      unsigned_transaction_hash: params.unsignedTransactionHash,
      transaction_type: "authentication_tx",
      transaction_hash: params.transactionHash,
    };

    return {
      name: EventType.SessionAuthentication,
      type: EventType.SessionAuthentication,
      data,
    };
  }

  static createInvoicingTransactionSignedEvent(
    params: LedgerSyncEventParams & {
      transactionHash: string;
      transactionType: "ETH_transfer" | "ERC-20_approve";
      sourceToken: string;
      targetToken: string;
      recipientAddress: string;
      transactionAmount: string;
      transactionId: string;
    },
  ): EventRequest {
    const data: InvoicingTransactionSignedEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: EventType.InvoicingTransactionSigned,
      ledger_sync_user_id: params.ledgerSyncUserId,
      blockchain_network_selected: "ethereum",
      transaction_type: params.transactionType,
      transaction_hash: params.transactionHash,
      source_token: params.sourceToken,
      target_token: params.targetToken,
      recipient_address: params.recipientAddress,
      transaction_amount: params.transactionAmount,
      transaction_id: params.transactionId,
    };

    return {
      name: EventType.InvoicingTransactionSigned,
      type: EventType.InvoicingTransactionSigned,
      data,
    };
  }
}
