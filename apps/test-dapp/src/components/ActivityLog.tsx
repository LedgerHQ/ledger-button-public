"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";
import {
  Bolt,
  CheckmarkCircleFill,
  DeleteCircleFill,
  InformationFill,
  Note,
} from "@ledgerhq/lumen-ui-react/symbols";

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
  { tag: "accent" | "success" | "error" | "gray"; border: string; icon: ReactNode }
> = {
  event: {
    tag: "accent",
    border: "border-l-accent",
    icon: <Bolt size={16} className="text-accent" />,
  },
  result: {
    tag: "success",
    border: "border-l-success",
    icon: <CheckmarkCircleFill size={16} className="text-success" />,
  },
  error: {
    tag: "error",
    border: "border-l-error",
    icon: <DeleteCircleFill size={16} className="text-error" />,
  },
  info: {
    tag: "gray",
    border: "border-l-muted",
    icon: <InformationFill size={16} className="text-muted" />,
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

const MAX_DISPLAY_ENTRIES = 200;

export function ActivityLog({ entries, onClear }: ActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const hiddenCount = Math.max(0, entries.length - MAX_DISPLAY_ENTRIES);
  const visibleEntries = useMemo(
    () => entries.slice(-MAX_DISPLAY_ENTRIES),
    [entries],
  );

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
            <span className="mb-12 opacity-40"><Note size={40} /></span>
            <p className="body-2 text-muted">No activity yet.</p>
            <p className="body-2 text-muted mt-6">
              Events, results, and errors will appear here as you interact with
              the provider.
            </p>
          </div>
        ) : (
          <>
          {hiddenCount > 0 && (
            <div className="text-center py-8">
              <span className="body-4 text-muted">
                {hiddenCount} older {hiddenCount === 1 ? "entry" : "entries"} hidden
              </span>
            </div>
          )}
          {visibleEntries.map((entry) => {
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
                  {style.icon}
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
          })}
          </>
        )}
      </div>
    </div>
  );
}
