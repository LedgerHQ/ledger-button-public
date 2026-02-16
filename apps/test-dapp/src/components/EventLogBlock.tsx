"use client";

import { useState } from "react";

import blockStyles from "./Block.module.css";
import styles from "./EventLogBlock.module.css";

export interface EIPEvent {
  id: string;
  type: "accountsChanged" | "chainChanged" | "disconnect" | "connect" | "message";
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

const EVENT_CARD_MODIFIERS: Partial<Record<EIPEvent["type"], string>> = {
  accountsChanged: styles["event-log__card--accounts-changed"],
  chainChanged: styles["event-log__card--chain-changed"],
  disconnect: styles["event-log__card--disconnect"],
  connect: styles["event-log__card--connect"],
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
    <div className={blockStyles.block}>
      <div
        className={blockStyles["block__header"]}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className={blockStyles["block__title"]}>
          <span className={blockStyles["block__icon"]}>📡</span>
          EIP-1193 Event Log
          {events.length > 0 && (
            <span className={blockStyles["block__badge"]}>{events.length}</span>
          )}
        </h3>
        <span className={blockStyles["block__toggle"]}>{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div className={blockStyles["block__content"]}>
          <p className={blockStyles["block__description"]}>
            Real-time log of provider events: accountsChanged, chainChanged, disconnect.
          </p>

          {events.length > 0 && (
            <div className={blockStyles["block__actions"]}>
              <button className={styles["event-log__clear-button"]} onClick={onClearEvents}>
                Clear Log
              </button>
            </div>
          )}

          <div className={styles["event-log__list"]}>
            {events.length === 0 ? (
              <div className={blockStyles["block__empty-state"]}>
                <p>No events yet.</p>
                <p className={blockStyles["block__hint"]}>
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
                    className={`${styles["event-log__card"]} ${EVENT_CARD_MODIFIERS[event.type] ?? ""}`}
                  >
                    <div className={styles["event-log__card-header"]}>
                      <span className={styles["event-log__card-icon"]}>
                        {EVENT_ICONS[event.type]}
                      </span>
                      <span className={styles["event-log__card-type"]}>{event.type}</span>
                      <span className={styles["event-log__card-time"]}>
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <div className={styles["event-log__card-data"]}>
                      <code>{formatData(event.data)}</code>
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
