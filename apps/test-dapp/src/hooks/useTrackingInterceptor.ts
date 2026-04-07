"use client";

import { useCallback, useEffect, useState } from "react";

export interface TrackingEntry {
  id: string;
  timestamp: Date;
  eventName: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: "pending" | "success" | "error";
  httpStatus?: number;
}

let trackingCounter = 0;

function nextId(): string {
  trackingCounter += 1;
  return `tracking-${Date.now()}-${trackingCounter}`;
}

const EVENT_PATH = "/event";

export function useTrackingInterceptor() {
  const [entries, setEntries] = useState<TrackingEntry[]>([]);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      const isTrackingEvent =
        url.endsWith(EVENT_PATH) && init?.method?.toUpperCase() === "POST";

      if (!isTrackingEvent) {
        return originalFetch(input, init);
      }

      const parsed = (() => {
        try {
          return JSON.parse(String(init?.body ?? "{}")) as Record<
            string,
            unknown
          >;
        } catch {
          return {};
        }
      })();

      const entryId = nextId();

      setEntries((prev) => [
        ...prev,
        {
          id: entryId,
          timestamp: new Date(),
          eventName: String(parsed.name ?? "unknown"),
          eventType: String(parsed.type ?? "unknown"),
          payload: parsed,
          status: "pending",
        },
      ]);

      try {
        const response = await originalFetch(input, init);

        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  status: response.ok ? "success" : "error",
                  httpStatus: response.status,
                }
              : e,
          ),
        );

        return response;
      } catch (err) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, status: "error" } : e,
          ),
        );
        throw err;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const clearEntries = useCallback(() => setEntries([]), []);

  return { entries, clearEntries };
}
