"use client";

import { useCallback, useRef, useState } from "react";
import { Button, Spinner, Tag } from "@ledgerhq/lumen-ui-react";
import {
  Chart1,
  CheckmarkCircle,
  DeleteCircle,
} from "@ledgerhq/lumen-ui-react/symbols";

import { BACKEND_URLS } from "../lib/constants";
import {
  type EventRequest,
  type Scenario,
  type ScenarioContext,
  SCENARIOS,
} from "../lib/tracking-scenarios";

const EVENT_DELAY_MS = 300;

type EventResult = {
  type: string;
  status: "pending" | "success" | "error";
  httpStatus?: number;
  message?: string;
};

interface EventSimulatorBlockProps {
  environment: string;
  dAppIdentifier: string;
  apiKey: string;
}

async function sendEvent(
  backendUrl: string,
  dAppIdentifier: string,
  apiKey: string,
  event: EventRequest,
): Promise<{ ok: boolean; status: number }> {
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
  return { ok: response.ok, status: response.status };
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

  const updateResult = (index: number, update: Partial<EventResult>) =>
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...update } : r)),
    );

  const runScenario = useCallback(
    async (scenario: Scenario) => {
      abortRef.current = false;
      setIsRunning(true);
      setActiveScenario(scenario.name);

      const ctx: ScenarioContext = {
        dAppId: dAppIdentifier,
        sessionId: crypto.randomUUID(),
        chainId: "1",
      };

      const events = scenario.buildEvents(ctx);
      setResults(events.map((e) => ({ type: e.type, status: "pending" })));

      for (let i = 0; i < events.length; i++) {
        if (abortRef.current) break;

        try {
          const { ok, status } = await sendEvent(
            backendUrl,
            dAppIdentifier,
            apiKey,
            events[i],
          );
          updateResult(i, {
            status: ok ? "success" : "error",
            httpStatus: status,
            message: ok ? undefined : `HTTP ${status}`,
          });
        } catch (err) {
          updateResult(i, {
            status: "error",
            message: err instanceof Error ? err.message : String(err),
          });
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

  const completedCount = results.filter((r) => r.status !== "pending").length;

  return (
    <div className="border border-muted rounded-lg overflow-clip">
      <div
        className="flex justify-between items-center px-20 py-16 cursor-pointer select-none hover:bg-muted-transparent transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="flex items-center gap-10 body-2-semi-bold text-base">
          {isRunning ? <Spinner size={16} /> : <Chart1 size={20} />}
          Event Simulator
          <Tag appearance="accent" size="sm" label={environment} />
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
                <span className="body-4 text-muted">
                  {scenario.description}
                </span>
              </button>
            ))}
          </div>

          {results.length > 0 && (
            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-8">
                  <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
                    {activeScenario}
                  </h4>
                  <span className="body-4 text-muted">
                    {completedCount}/{results.length}
                  </span>
                </div>
                <div className="flex gap-8">
                  {isRunning ? (
                    <Button appearance="gray" size="sm" onClick={handleStop}>
                      Stop
                    </Button>
                  ) : (
                    <Button appearance="gray" size="sm" onClick={handleClear}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-[3px] rounded-full bg-muted overflow-clip">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-accent"
                  style={{
                    width: `${(completedCount / results.length) * 100}%`,
                  }}
                />
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
                    <span
                      className={
                        r.status === "success"
                          ? "text-success"
                          : r.status === "error"
                            ? "text-error"
                            : "text-muted"
                      }
                    >
                      {r.status === "pending" ? (
                        <Spinner size={16} />
                      ) : r.status === "success" ? (
                        <CheckmarkCircle size={16} />
                      ) : (
                        <DeleteCircle size={16} />
                      )}
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
