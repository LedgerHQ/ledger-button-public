export interface EventRequest {
  name: string;
  type: string;
  data: Record<string, unknown>;
}

export interface ScenarioContext {
  dAppId: string;
  sessionId: string;
  chainId: string;
}

export interface Scenario {
  name: string;
  description: string;
  buildEvents: (ctx: ScenarioContext) => EventRequest[];
}

function hexHash(length = 64): string {
  const chars = "0123456789abcdef";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
}

function baseData(ctx: ScenarioContext) {
  return {
    event_id: crypto.randomUUID(),
    transaction_dapp_id: ctx.dAppId,
    timestamp_ms: Date.now(),
  };
}

function sessionEvent(ctx: ScenarioContext, eventType: string) {
  return {
    name: eventType,
    type: eventType,
    data: {
      ...baseData(ctx),
      event_type: eventType,
      session_id: ctx.sessionId,
    },
  };
}

function chainEvent(
  ctx: ScenarioContext,
  eventType: string,
  extra?: Record<string, unknown>,
) {
  return {
    name: eventType,
    type: eventType,
    data: {
      ...baseData(ctx),
      event_type: eventType,
      session_id: ctx.sessionId,
      blockchain_network_selected: "ethereum",
      chain_id: ctx.chainId,
      ...extra,
    },
  };
}

const consentGiven = (ctx: ScenarioContext): EventRequest => ({
  name: "consent_given",
  type: "consent_given",
  data: { ...baseData(ctx), event_type: "consent_given" },
});

const openSession = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "open_session");

const openLedgerSync = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "open_ledger_sync");

const ledgerSyncActivated = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "ledger_sync_activated");

const onboarding = (ctx: ScenarioContext) =>
  chainEvent(ctx, "onboarding");

const floatingButtonClicked = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "floating_button_clicked");

const transactionFlowInitialization = (ctx: ScenarioContext) =>
  chainEvent(ctx, "transaction_flow_initialization");

const transactionFlowCompletion = (ctx: ScenarioContext) =>
  chainEvent(ctx, "transaction_flow_completion");

const invoicingTransactionSigned = (ctx: ScenarioContext): EventRequest => ({
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
});

const typedMessageFlowInitialization = (ctx: ScenarioContext) =>
  chainEvent(ctx, "typed_message_flow_initialization", {
    typed_message_hash: hexHash(),
  });

const typedMessageFlowCompletion = (ctx: ScenarioContext) =>
  chainEvent(ctx, "typed_message_flow_completion", {
    typed_message_hash: hexHash(),
  });

const walletActionClicked = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "wallet_action_clicked");

const walletRedirectConfirmed = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "wallet_redirect_confirmed");

const walletRedirectCancelled = (ctx: ScenarioContext) =>
  sessionEvent(ctx, "wallet_redirect_cancelled");

const errorOccurred = (ctx: ScenarioContext): EventRequest =>
  sessionEvent(ctx, "error_occurred");

const mobileRedirectLedgerWallet = (ctx: ScenarioContext): EventRequest => ({
  name: "mobile_redirect_ledger_wallet",
  type: "mobile_redirect_ledger_wallet",
  data: { ...baseData(ctx), event_type: "mobile_redirect_ledger_wallet" },
});

export const SCENARIOS: Scenario[] = [
  {
    name: "onboarding",
    description: "Consent > session > ledger sync > onboarding",
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
    description: "Button click > tx init > auth > tx completion",
    buildEvents: (ctx) => [
      floatingButtonClicked(ctx),
      transactionFlowInitialization(ctx),
      transactionFlowCompletion(ctx),
    ],
  },
  {
    name: "message-signing",
    description: "Typed message init > completion",
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
    description: "Wallet action click > redirect confirmed",
    buildEvents: (ctx) => [
      walletActionClicked(ctx),
      walletRedirectConfirmed(ctx),
    ],
  },
  {
    name: "wallet-action-cancelled",
    description: "Wallet action click > redirect cancelled",
    buildEvents: (ctx) => [
      walletActionClicked(ctx),
      walletRedirectCancelled(ctx),
    ],
  },
  {
    name: "mobile-redirect",
    description: "Mobile redirect to Ledger Wallet app",
    buildEvents: (ctx) => [mobileRedirectLedgerWallet(ctx)],
  },
  {
    name: "error",
    description: "Simulated error event",
    buildEvents: (ctx) => [errorOccurred(ctx)],
  },
  {
    name: "full-session",
    description: "Full flow: onboarding > tx > message > wallet",
    buildEvents: (ctx) => [
      consentGiven(ctx),
      openSession(ctx),
      openLedgerSync(ctx),
      ledgerSyncActivated(ctx),
      onboarding(ctx),
      floatingButtonClicked(ctx),
      transactionFlowInitialization(ctx),
      transactionFlowCompletion(ctx),
      invoicingTransactionSigned(ctx),
      typedMessageFlowInitialization(ctx),
      typedMessageFlowCompletion(ctx),
      walletActionClicked(ctx),
      walletRedirectConfirmed(ctx),
      mobileRedirectLedgerWallet(ctx),
    ],
  },
];
