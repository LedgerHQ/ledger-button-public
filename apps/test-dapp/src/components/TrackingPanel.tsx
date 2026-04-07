"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Tag } from "@ledgerhq/lumen-ui-react";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import {
  CheckmarkCircleFill,
  DeleteCircleFill,
  Note,
  Target,
} from "@ledgerhq/lumen-ui-react/symbols";

import type { TrackingEntry } from "../hooks/useTrackingInterceptor";
import { cn } from "../lib/utils";

interface TrackingPanelProps {
  entries: TrackingEntry[];
  onClear: () => void;
}

const formatTime = (date: Date): string =>
  date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

function StatusIcon({ status }: { status: TrackingEntry["status"] }) {
  if (status === "pending") return <Spinner size={16} />;
  if (status === "success")
    return <CheckmarkCircleFill size={16} className="text-success" />;
  return <DeleteCircleFill size={16} className="text-error" />;
}

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

function TrackingEntryRow({ entry }: { entry: TrackingEntry }) {
  const [expanded, setExpanded] = useState(false);
  const payloadJson = JSON.stringify(entry.payload, null, 2);

  return (
    <div
      className={cn(
        "px-14 py-12 rounded-lg bg-muted border-l-[3px]",
        entry.status === "success"
          ? "border-l-success"
          : entry.status === "error"
            ? "border-l-error"
            : "border-l-accent",
      )}
    >
      <div
        className="flex items-center gap-8 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusIcon status={entry.status} />
        <Tag appearance="accent" size="sm" label={entry.eventType} />
        <span className="body-4 font-mono text-base truncate flex-1">
          {entry.eventName}
        </span>
        {entry.httpStatus && (
          <Tag
            appearance={entry.httpStatus < 400 ? "success" : "error"}
            size="sm"
            label={String(entry.httpStatus)}
          />
        )}
        <span className="body-4 text-muted font-mono shrink-0">
          {formatTime(entry.timestamp)}
        </span>
      </div>

      {expanded && (
        <div className="mt-8 pt-8 border-t border-muted">
          <div className="flex items-start gap-8">
            <pre className="body-4 font-mono text-muted break-all leading-relaxed whitespace-pre-wrap min-w-0 flex-1">
              {payloadJson}
            </pre>
            <CopyButton text={payloadJson} />
          </div>
        </div>
      )}
    </div>
  );
}

const MAX_DISPLAY_ENTRIES = 200;

export function TrackingPanel({ entries, onClear }: TrackingPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const hiddenCount = Math.max(0, entries.length - MAX_DISPLAY_ENTRIES);
  const visibleEntries = entries.slice(-MAX_DISPLAY_ENTRIES);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="flex flex-col border border-muted rounded-lg overflow-clip bg-canvas min-h-0 h-full">
      <div className="flex items-center justify-between px-20 py-14 border-b border-muted bg-muted shrink-0">
        <div className="flex items-center gap-10">
          <Target size={16} />
          <span className="body-2-semi-bold text-base">Tracking Events</span>
          {entries.length > 0 && (
            <Tag
              appearance="accent"
              size="sm"
              label={String(entries.length)}
            />
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
            <span className="mb-12 opacity-40">
              <Note size={40} />
            </span>
            <p className="body-2 text-muted">No tracking events yet.</p>
            <p className="body-2 text-muted mt-6">
              Events sent to the backend will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            {hiddenCount > 0 && (
              <div className="text-center py-8">
                <span className="body-4 text-muted">
                  {hiddenCount} older{" "}
                  {hiddenCount === 1 ? "entry" : "entries"} hidden
                </span>
              </div>
            )}
            {visibleEntries.map((entry) => (
              <TrackingEntryRow key={entry.id} entry={entry} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
