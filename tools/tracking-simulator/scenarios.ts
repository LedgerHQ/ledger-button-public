function uuid(): string {
  return crypto.randomUUID();
}

function hexHash(length = 64): string {
  const chars = "0123456789abcdef";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
}

export type Environment = "staging" | "production";

export interface EventRequest {
  name: string;
  type: string;
  data: Record<string, unknown>;
}

export interface ScenarioContext {
  dAppId: string;
  sessionId: string;
  trustChainId?: string;
  chainId: string;
}

export interface Scenario {
  name: string;
  description: string;
  buildEvents: (ctx: ScenarioContext) => EventRequest[];
}

function baseData(ctx: ScenarioContext) {
  return {
    event_id: uuid(),
    transaction_dapp_id: ctx.dAppId,
    timestamp_ms: Date.now(),
  };
}

function consentGiven(ctx: ScenarioContext): EventRequest {
  return {
    name: "consent_given",
    type: "consent_given",
    data: {
      ...baseData(ctx),
      event_type: "consent_given",
    },
  };
}

function openSession(ctx: ScenarioContext): EventRequest {
  return {
    name: "open_session",
    type: "open_session",
    data: {
      ...baseData(ctx),
      event_type: "open_session",
      session_id: ctx.sessionId,
    },
  };
}

function openLedgerSync(ctx: ScenarioContext): EventRequest {
  return {
    name: "open_ledger_sync",
    type: "open_ledger_sync",
    data: {
      ...baseData(ctx),
      event_type: "open_ledger_sync",
      session_id: ctx.sessionId,
    },
  };
}

function ledgerSyncActivated(ctx: ScenarioContext): EventRequest {
  return {
    name: "ledger_sync_activated",
    type: "ledger_sync_activated",
    data: {
      ...baseData(ctx),
      event_type: "ledger_sync_activated",
      session_id: ctx.sessionId,
      ledger_sync_user_id: ctx.trustChainId,
    },
  };
}

function onboarding(ctx: ScenarioContext): EventRequest {
  return {
    name: "onboarding",
    type: "onboarding",
    data: {
      ...baseData(ctx),
      event_type: "onboarding",
      session_id: ctx.sessionId,
      ledger_sync_user_id: ctx.trustChainId,
      blockchain_network_selected: "ethereum",
      chain_id: ctx.chainId,
    },
  };
}

function floatingButtonClicked(ctx: ScenarioContext): EventRequest {
  return {
    name: "floating_button_clicked",
    type: "floating_button_clicked",
    data: {
      ...baseData(ctx),
      event_type: "floating_button_clicked",
      session_id: ctx.sessionId,
    },
  };
}

function transactionFlowInitialization(ctx: ScenarioContext): EventRequest {
  return {
    name: "transaction_flow_initialization",
    type: "transaction_flow_initialization",
    data: {
      ...baseData(ctx),
      event_type: "transaction_flow_initialization",
      session_id: ctx.sessionId,
      ledger_sync_user_id: ctx.trustChainId,
      blockchain_network_selected: "ethereum",
      chain_id: ctx.chainId,
    },
  };
}

function transactionFlowCompletion(ctx: ScenarioContext): EventRequest {
  return {
    name: "transaction_flow_completion",
    type: "transaction_flow_completion",
    data: {
      ...baseData(ctx),
      event_type: "transaction_flow_completion",
      session_id: ctx.sessionId,
      ledger_sync_user_id: ctx.trustChainId,
      blockchain_network_selected: "ethereum",
      chain_id: ctx.chainId,
    },
  };
}

function sessionAuthentication(ctx: ScenarioContext): EventRequest {
  return {
    name: "session_authentication",
    type: "session_authentication",
    data: {
      ...baseData(ctx),
      event_type: "session_authentication",
      session_id: ctx.sessionId,
      ledger_sync_user_id: ctx.trustChainId,
      blockchain_network_selected: "ethereum",
      transaction_type: "authentication_tx",
      transaction_hash: hexHash(),
    },
  };
}

function invoicingTransactionSigned(ctx: ScenarioContext): EventRequest {
  return {
    name: "invoicing_transaction_signed",
    type: "invoicing_transaction_signed",
    data: {
      ...baseData(ctx),
      event_type: "invoicing_transaction_signed",
      blockchain_network_selected: "ethereum",
      chain_id: ctx.chainId,
      transaction_hash: hexHash(),
      recipient_address: hexHash(40),
      unsigned_transaction_hash: hexHash(),
    },
  };
}

function typedMessageFlowInitialization(ctx: ScenarioContext): EventRequest {
  return {
    name: "typed_message_flow_initialization",
    type: "typed_message_flow_initialization",
    data: {
      ...baseData(ctx),
      event_type: "typed_message_flow_initialization",
      session_id: ctx.sessionId,
      ledger_sync_user_id: ctx.trustChainId,
      blockchain_network_selected: "ethereum",
      chain_id: ctx.chainId,
      typed_message_hash: hexHash(),
    },
  };
}

function typedMessageFlowCompletion(ctx: ScenarioContext): EventRequest {
  return {
    name: "typed_message_flow_completion",
    type: "typed_message_flow_completion",
    data: {
      ...baseData(ctx),
      event_type: "typed_message_flow_completion",
      session_id: ctx.sessionId,
      ledger_sync_user_id: ctx.trustChainId,
      blockchain_network_selected: "ethereum",
      chain_id: ctx.chainId,
      typed_message_hash: hexHash(),
    },
  };
}

function walletActionClicked(
  ctx: ScenarioContext,
  action = "send" as const,
): EventRequest {
  return {
    name: "wallet_action_clicked",
    type: "wallet_action_clicked",
    data: {
      ...baseData(ctx),
      event_type: "wallet_action_clicked",
      session_id: ctx.sessionId,
      wallet_action: action,
    },
  };
}

function walletRedirectConfirmed(
  ctx: ScenarioContext,
  action = "send" as const,
): EventRequest {
  return {
    name: "wallet_redirect_confirmed",
    type: "wallet_redirect_confirmed",
    data: {
      ...baseData(ctx),
      event_type: "wallet_redirect_confirmed",
      session_id: ctx.sessionId,
      wallet_action: action,
    },
  };
}

function errorOccurred(ctx: ScenarioContext): EventRequest {
  return {
    name: "error_occurred",
    type: "error_occurred",
    data: {
      ...baseData(ctx),
      event_type: "error_occurred",
      session_id: ctx.sessionId,
      error_type: "SimulatedError",
      error_code: "SIM_001",
      error_message: "Simulated error for testing",
      error_category: "tracking_test",
    },
  };
}

export const scenarios: Scenario[] = [
  {
    name: "onboarding",
    description: "Onboarding: consent > session > ledger sync > onboarding",
    buildEvents: (ctx) => [
      consentGiven(ctx),
      openSession(ctx),
      openLedgerSync(ctx),
      ledgerSyncActivated(ctx),
      onboarding(ctx),
    ],
  },
  {
    name: "transaction",
    description: "Transaction signing: button click > tx init > auth > tx completion",
    buildEvents: (ctx) => [
      floatingButtonClicked(ctx),
      transactionFlowInitialization(ctx),
      sessionAuthentication(ctx),
      transactionFlowCompletion(ctx),
    ],
  },
  {
    name: "message-signing",
    description: "Typed message signing: init > completion",
    buildEvents: (ctx) => [
      typedMessageFlowInitialization(ctx),
      typedMessageFlowCompletion(ctx),
    ],
  },
  {
    name: "invoicing",
    description: "Invoicing transaction signed",
    buildEvents: (ctx) => [invoicingTransactionSigned(ctx)],
  },
  {
    name: "wallet-action",
    description: "Wallet action: click > redirect confirmed",
    buildEvents: (ctx) => [
      walletActionClicked(ctx),
      walletRedirectConfirmed(ctx),
    ],
  },
  {
    name: "error",
    description: "Error event",
    buildEvents: (ctx) => [errorOccurred(ctx)],
  },
  {
    name: "full-session",
    description: "Full flow: onboarding > transaction > message signing > wallet action",
    buildEvents: (ctx) => [
      consentGiven(ctx),
      openSession(ctx),
      openLedgerSync(ctx),
      ledgerSyncActivated(ctx),
      onboarding(ctx),
      floatingButtonClicked(ctx),
      transactionFlowInitialization(ctx),
      sessionAuthentication(ctx),
      transactionFlowCompletion(ctx),
      invoicingTransactionSigned(ctx),
      typedMessageFlowInitialization(ctx),
      typedMessageFlowCompletion(ctx),
      walletActionClicked(ctx),
      walletRedirectConfirmed(ctx),
    ],
  },
];
