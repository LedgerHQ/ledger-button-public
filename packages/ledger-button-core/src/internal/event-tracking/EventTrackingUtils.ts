function generateUUID(): string {
  return URL.createObjectURL(new Blob([])).slice(-36);
}

import type {
  ConsentGivenEventData,
  ConsentRemovedEventData,
  EventRequest,
  InvoicingTransactionSignedEventData,
  LedgerSyncActivatedEventData,
  OnboardingEventData,
  OpenLedgerSyncEventData,
  OpenSessionEventData,
  SessionAuthenticationEventData,
  TransactionFlowCompletionEventData,
  TransactionFlowInitializationEventData,
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
      event_type: "open_session",
      session_id: params.sessionId,
    };

    return {
      name: "open_session",
      type: "open_session",
      data,
    };
  }

  static createOpenLedgerSyncEvent(params: SessionEventParams): EventRequest {
    const data: OpenLedgerSyncEventData = {
      event_id: generateUUID(),
      transaction_dapp_id: params.dAppId,
      timestamp_ms: Date.now(),
      event_type: "open_ledger_sync",
      session_id: params.sessionId,
    };

    return {
      name: "open_ledger_sync",
      type: "open_ledger_sync",
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
      event_type: "ledger_sync_activated",
      session_id: params.sessionId,
      ledger_sync_user_id: params.ledgerSyncUserId,
    };

    return {
      name: "ledger_sync_activated",
      type: "ledger_sync_activated",
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
      event_type: "consent_given",
      ledger_sync_user_id: params.ledgerSyncUserId,
    };

    return {
      name: "consent_given",
      type: "consent_given",
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
      event_type: "consent_removed",
      ledger_sync_user_id: params.ledgerSyncUserId,
    };

    return {
      name: "consent_removed",
      type: "consent_removed",
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
      event_type: "onboarding",
      session_id: params.sessionId,
      ledger_sync_user_id: params.ledgerSyncUserId,
      blockchain_network_selected: "ethereum",
      account_currency: params.accountCurrency,
      account_balance: params.accountBalance,
    };

    return {
      name: "onboarding",
      type: "onboarding",
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
      event_type: "transaction_flow_initialization",
      session_id: params.sessionId,
      ledger_sync_user_id: params.ledgerSyncUserId,
      blockchain_network_selected: "ethereum",
      account_currency: params.accountCurrency,
      account_balance: params.accountBalance,
      unsigned_transaction_hash: params.unsignedTransactionHash,
      transaction_type: params.transactionType,
    };

    return {
      name: "transaction_flow_initialization",
      type: "transaction_flow_initialization",
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
      event_type: "transaction_flow_completion",
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
      name: "transaction_flow_completion",
      type: "transaction_flow_completion",
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
      event_type: "session_authentication",
      session_id: params.sessionId,
      ledger_sync_user_id: params.ledgerSyncUserId,
      blockchain_network_selected: "ethereum",
      unsigned_transaction_hash: params.unsignedTransactionHash,
      transaction_type: "authentication_tx",
      transaction_hash: params.transactionHash,
    };

    return {
      name: "session_authentication",
      type: "session_authentication",
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
      event_type: "invoicing_transaction_signed",
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
      name: "invoicing_transaction_signed",
      type: "invoicing_transaction_signed",
      data,
    };
  }
}
