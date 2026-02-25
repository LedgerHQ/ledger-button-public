"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";

import { cn } from "../lib/utils";

export interface ActivityEntry {
  id: string;
  kind: "event" | "result" | "error" | "info";
  label: string;
  timestamp: Date;
  data?: unknown;
}

interface ActivityLogProps {
  entries: ActivityEntry[];
  onClear: () => void;
}

const KIND_STYLES: Record<
  ActivityEntry["kind"],
  { tag: "accent" | "success" | "error" | "gray"; border: string; icon: string }
> = {
  event: {
    tag: "accent",
    border: "border-l-accent",
    icon: "📡",
  },
  result: {
    tag: "success",
    border: "border-l-success",
    icon: "✅",
  },
  error: {
    tag: "error",
    border: "border-l-error",
    icon: "❌",
  },
  info: {
    tag: "gray",
    border: "border-l-muted",
    icon: "ℹ️",
  },
};

const formatTime = (date: Date): string =>
  date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const formatData = (data: unknown): string => {
  if (data === undefined || data === null) return "—";
  if (typeof data === "string") return data;
  return JSON.stringify(data, null, 2);
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="body-4 text-muted hover:text-base transition-colors cursor-pointer shrink-0"
      title="Copy to clipboard"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function ActivityLog({ entries, onClear }: ActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="flex flex-col border border-muted rounded-lg overflow-hidden bg-canvas h-full">
      <div className="flex items-center justify-between px-20 py-14 border-b border-muted bg-muted shrink-0">
        <div className="flex items-center gap-10">
          <span className="body-2-semi-bold text-base">Activity Log</span>
          {entries.length > 0 && (
            <Tag appearance="accent" size="sm" label={String(entries.length)} />
          )}
        </div>
        {entries.length > 0 && (
          <Button appearance="gray" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 p-14 space-y-10"
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-20">
            <span className="text-[32px] mb-12 opacity-40">📋</span>
            <p className="body-2 text-muted">No activity yet.</p>
            <p className="body-2 text-muted mt-6">
              Events, results, and errors will appear here as you interact with
              the provider.
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const style = KIND_STYLES[entry.kind];
            return (
              <div
                key={entry.id}
                className={cn(
                  "px-14 py-12 rounded-lg bg-muted border-l-[3px]",
                  style.border,
                )}
              >
                <div className="flex items-center gap-8 mb-6">
                  <span className="text-[14px]">{style.icon}</span>
                  <Tag appearance={style.tag} size="sm" label={entry.label} />
                  <span className="body-4 text-muted font-mono ml-auto">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                {entry.data !== undefined && entry.data !== null && (
                  <div className="flex items-start gap-8">
                    <pre
                      className={cn(
                        "body-4 font-mono break-all leading-relaxed whitespace-pre-wrap min-w-0 flex-1",
                        entry.kind === "error" ? "text-error" : "text-muted",
                      )}
                    >
                      {formatData(entry.data)}
                    </pre>
                    <CopyButton text={formatData(entry.data)} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
