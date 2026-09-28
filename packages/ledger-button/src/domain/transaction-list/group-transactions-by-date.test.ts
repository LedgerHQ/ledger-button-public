import { describe, expect, it } from "vitest";

import {
  formatDisplayDate,
  groupTransactionsByDate,
  toLocalDateKey,
} from "./group-transactions-by-date";

type Item = { hash: string; date: string; time: string; timestamp: string };

function makeItem(hash: string, timestamp: string): Item {
  const date = new Date(timestamp);
  return {
    hash,
    timestamp,
    date: toLocalDateKey(date),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

describe("groupTransactionsByDate", () => {
  it("should order by instant even when times are formatted with AM/PM", () => {
    const items = [
      makeItem("sol-1139", "2026-09-28T09:39:00Z"),
      makeItem("sol-1140", "2026-09-28T09:40:00Z"),
      makeItem("usdc-1141", "2026-09-28T09:41:00Z"),
      makeItem("usdc-1139", "2026-09-28T09:39:30Z"),
    ];

    const hashes = groupTransactionsByDate(items).flatMap((group) =>
      group.transactions.map((tx) => tx.hash),
    );

    expect(hashes).toEqual(["usdc-1141", "sol-1140", "usdc-1139", "sol-1139"]);
  });

  it("should place a late-night UTC transaction before earlier ones and under its local day", () => {
    const lateNight = makeItem("late", "2026-09-28T23:30:00Z");
    const evening = makeItem("evening", "2026-09-28T20:00:00Z");
    const morning = makeItem("morning", "2026-09-28T08:15:00Z");

    const groups = groupTransactionsByDate([morning, lateNight, evening]);
    const hashes = groups.flatMap((group) =>
      group.transactions.map((tx) => tx.hash),
    );

    expect(hashes).toEqual(["late", "evening", "morning"]);
    const lateGroup = groups.find((group) =>
      group.transactions.some((tx) => tx.hash === "late"),
    );
    expect(lateGroup?.date).toBe(toLocalDateKey(new Date(lateNight.timestamp)));
  });

  it("should keep groups in descending day order", () => {
    const groups = groupTransactionsByDate([
      makeItem("old", "2026-09-20T12:00:00Z"),
      makeItem("new", "2026-09-28T12:00:00Z"),
    ]);

    expect(groups.map((group) => group.transactions[0]?.hash)).toEqual([
      "new",
      "old",
    ]);
  });
});

describe("formatDisplayDate", () => {
  it("should format a date key without shifting the day", () => {
    expect(formatDisplayDate("2026-09-28")).toBe("28/09/2026");
  });
});

describe("toLocalDateKey", () => {
  it("should use the local calendar day", () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 0, 30))).toBe("2026-01-05");
  });
});
