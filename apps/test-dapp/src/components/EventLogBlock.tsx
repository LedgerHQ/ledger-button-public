"use client";

import { useState } from "react";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";

import { cn } from "../lib/utils";

export interface EIPEvent {
  id: string;
  type:
    | "accountsChanged"
    | "chainChanged"
    | "disconnect"
    | "connect"
    | "message";
  timestamp: Date;
  data: unknown;
}

interface EventLogBlockProps {
  events: EIPEvent[];
  onClearEvents: () => void;
}

const EVENT_ICONS: Record<EIPEvent["type"], string> = {
  accountsChanged: "👛",
  chainChanged: "🔗",
  disconnect: "🔌",
  connect: "✅",
  message: "💬",
};

const EVENT_TAG_APPEARANCE: Record<
  EIPEvent["type"],
  "accent" | "success" | "error" | "warning" | "gray"
> = {
  accountsChanged: "accent",
  chainChanged: "accent",
  disconnect: "error",
  connect: "success",
  message: "gray",
};

const EVENT_CARD_STYLES: Partial<Record<EIPEvent["type"], string>> = {
  accountsChanged: "border-l-accent bg-accent-transparent",
  chainChanged: "border-l-accent bg-accent-transparent",
  disconnect: "border-l-error bg-error-transparent",
  connect: "border-l-success bg-success-transparent",
};

export function EventLogBlock({ events, onClearEvents }: EventLogBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatData = (data: unknown): string => {
    if (data === undefined || data === null) {
      return "—";
    }
    if (typeof data === "string") {
      return data;
    }
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return "[]";
      }
      if (data.length === 1 && typeof data[0] === "string") {
        return data[0].length > 20
          ? `${data[0].slice(0, 10)}...${data[0].slice(-8)}`
          : data[0];
      }
      return JSON.stringify(data);
    }
    return JSON.stringify(data);
  };

  return (
    <div className="border border-muted rounded-lg overflow-hidden">
      <div
        className="flex justify-between items-center px-20 py-16 cursor-pointer select-none hover:bg-muted-transparent transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="flex items-center gap-10 body-2-semi-bold text-base">
          <span>📡</span>
          EIP-1193 Event Log
          {events.length > 0 && (
            <Tag appearance="accent" size="sm" label={String(events.length)} />
          )}
        </h3>
        <span className="body-4 text-muted">
          {isExpanded ? "▼" : "▶"}
        </span>
      </div>

      {isExpanded && (
        <div className="p-20 border-t border-muted bg-canvas space-y-16">
          <p className="body-2 text-muted">
            Real-time log of provider events: accountsChanged, chainChanged,
            disconnect.
          </p>

          {events.length > 0 && (
            <div>
              <Button appearance="gray" size="sm" onClick={onClearEvents}>
                Clear Log
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-8 max-h-[300px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center p-24 bg-muted rounded-lg border border-dashed border-muted">
                <p className="body-2 text-muted">No events yet.</p>
                <p className="body-4 text-muted mt-8">
                  Events will appear here when the provider emits them.
                </p>
              </div>
            ) : (
              events
                .slice()
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "px-16 py-12 rounded-lg bg-muted border-l-[3px] border-l-muted",
                      EVENT_CARD_STYLES[event.type],
                    )}
                  >
                    <div className="flex items-center gap-8 mb-6">
                      <span className="text-[14px]">
                        {EVENT_ICONS[event.type]}
                      </span>
                      <span className="body-4-semi-bold text-base">
                        {event.type}
                      </span>
                      <Tag
                        appearance={EVENT_TAG_APPEARANCE[event.type]}
                        size="sm"
                        label={event.type}
                      />
                      <span className="body-4 text-muted font-mono ml-auto">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <div>
                      <code className="body-4 font-mono text-muted bg-muted-transparent px-6 py-2 rounded">
                        {formatData(event.data)}
                      </code>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}