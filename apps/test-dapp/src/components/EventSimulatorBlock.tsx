"use client";

import { useCallback, useRef, useState } from "react";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";
import { Chart1, CheckmarkCircle, Clock, DeleteCircle } from "@ledgerhq/lumen-ui-react/symbols";

function uuid(): string {
  return crypto.randomUUID();
}

function hexHash(length = 64): string {
  const chars = "0123456789abcdef";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
}

interface EventRequest {
  name: string;
  type: string;
  data: Record<string, unknown>;
}

interface ScenarioContext {
  dAppId: string;
  sessionId: string;
  chainId: string;
}

interface Scenario {
  name: string;
  description: string;
  buildEvents: (ctx: ScenarioContext) => EventRequest[];
}

type EventResult = {
  type: string;
  status: "pending" | "success" | "error";
  httpStatus?: number;
  message?: string;
};

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
    data: { ...baseData(ctx), event_type: "consent_given" },
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
      blockchain_network_selected: "ethereum",
      chain_id: ctx.chainId,
      typed_message_hash: hexHash(),
    },
  };
}

function walletActionClicked(ctx: ScenarioContext): EventRequest {
  return {
    name: "wallet_action_clicked",
    type: "wallet_action_clicked",
    data: {
      ...baseData(ctx),
      event_type: "wallet_action_clicked",
      session_id: ctx.sessionId,
      wallet_action: "send",
    },
  };
}

function walletRedirectConfirmed(ctx: ScenarioContext): EventRequest {
  return {
    name: "wallet_redirect_confirmed",
    type: "wallet_redirect_confirmed",
    data: {
      ...baseData(ctx),
      event_type: "wallet_redirect_confirmed",
      session_id: ctx.sessionId,
      wallet_action: "send",
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

const SCENARIOS: Scenario[] = [
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
      sessionAuthentication(ctx),
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

const BACKEND_URLS: Record<string, string> = {
  production: "https://ledgerb.api.ledger.com",
  staging: "https://ledgerb.aws.stg.ldg-tech.com",
};

const EVENT_DELAY_MS = 300;

interface EventSimulatorBlockProps {
  environment: string;
  dAppIdentifier: string;
  apiKey: string;
}

export function EventSimulatorBlock({
  environment,
  dAppIdentifier,
  apiKey,
}: EventSimulatorBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<EventResult[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const abortRef = useRef(false);

  const backendUrl = BACKEND_URLS[environment] ?? BACKEND_URLS.staging;

  const runScenario = useCallback(
    async (scenario: Scenario) => {
      abortRef.current = false;
      setIsRunning(true);
      setActiveScenario(scenario.name);

      const ctx: ScenarioContext = {
        dAppId: dAppIdentifier,
        sessionId: uuid(),
        chainId: "1",
      };

      const events = scenario.buildEvents(ctx);
      const initialResults: EventResult[] = events.map((e) => ({
        type: e.type,
        status: "pending" as const,
      }));
      setResults(initialResults);

      for (let i = 0; i < events.length; i++) {
        if (abortRef.current) break;

        const event = events[i];

        try {
          const response = await fetch(`${backendUrl}/event`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Ledger-Domain": dAppIdentifier,
              "X-Ledger-Origin-Token": apiKey,
              "X-Ledger-Client-Version": `tracking-simulator/0.0.0/${dAppIdentifier}`,
            },
            body: JSON.stringify(event),
          });

          setResults((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? {
                    ...r,
                    status: response.ok ? "success" : "error",
                    httpStatus: response.status,
                    message: response.ok
                      ? undefined
                      : `HTTP ${response.status}`,
                  }
                : r,
            ),
          );
        } catch (err) {
          setResults((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? {
                    ...r,
                    status: "error",
                    message:
                      err instanceof Error ? err.message : String(err),
                  }
                : r,
            ),
          );
        }

        if (i < events.length - 1 && !abortRef.current) {
          await new Promise((r) => setTimeout(r, EVENT_DELAY_MS));
        }
      }

      setIsRunning(false);
    },
    [backendUrl, dAppIdentifier, apiKey],
  );

  const handleStop = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
  }, []);

  const handleClear = useCallback(() => {
    setResults([]);
    setActiveScenario(null);
  }, []);

  return (
    <div className="border border-muted rounded-lg overflow-clip">
      <div
        className="flex justify-between items-center px-20 py-16 cursor-pointer select-none hover:bg-muted-transparent transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="flex items-center gap-10 body-2-semi-bold text-base">
          <Chart1 size={20} />
          Event Simulator
          <Tag appearance="accent" size="sm" label={environment} />
          {activeScenario && (
            <Tag
              appearance={isRunning ? "accent" : "gray"}
              size="sm"
              label={activeScenario}
            />
          )}
        </h3>
        <span className="body-4 text-muted">{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div className="p-20 border-t border-muted bg-canvas space-y-16">

          <div className="grid grid-cols-2 gap-8">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.name}
                disabled={isRunning}
                className="flex flex-col items-start p-12 bg-muted rounded-lg border border-muted hover:border-base hover:bg-muted-transparent transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                onClick={() => runScenario(scenario)}
              >
                <span className="body-2-semi-bold text-base">
                  {scenario.name}
                </span>
                <span className="body-4 text-muted">{scenario.description}</span>
              </button>
            ))}
          </div>

          {results.length > 0 && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
                  Results
                </h4>
                <div className="flex gap-8">
                  {isRunning && (
                    <Button appearance="gray" size="sm" onClick={handleStop}>
                      Stop
                    </Button>
                  )}
                  {!isRunning && (
                    <Button appearance="gray" size="sm" onClick={handleClear}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-8 px-12 py-8 rounded-lg text-left ${
                      r.status === "success"
                        ? "bg-success-transparent"
                        : r.status === "error"
                          ? "bg-error-transparent"
                          : "bg-muted"
                    }`}
                  >
                    <span className={
                      r.status === "success"
                        ? "text-success"
                        : r.status === "error"
                          ? "text-error"
                          : "text-muted"
                    }>
                      {r.status === "pending"
                        ? <Clock size={16} />
                        : r.status === "success"
                          ? <CheckmarkCircle size={16} />
                          : <DeleteCircle size={16} />}
                    </span>
                    <span className="body-4 font-mono text-base flex-1">
                      {r.type}
                    </span>
                    {r.message && (
                      <span className="body-4 text-muted">{r.message}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
