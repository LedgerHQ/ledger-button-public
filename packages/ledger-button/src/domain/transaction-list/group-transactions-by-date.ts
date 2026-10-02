type DatedTransaction = {
  date: string;
  timestamp: string;
};

export type TransactionDateGroup<T extends DatedTransaction> = {
  date: string;
  displayDate: string;
  transactions: T[];
};

/**
 * Returns the `YYYY-MM-DD` calendar day of `date` in the browser's timezone,
 * so the day header matches the locally displayed time.
 */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

export function groupTransactionsByDate<T extends DatedTransaction>(
  transactions: T[],
): TransactionDateGroup<T>[] {
  const sortedTransactions = [...transactions].sort(
    (a, b) => toSortableTime(b.timestamp) - toSortableTime(a.timestamp),
  );

  const groups = new Map<string, T[]>();
  for (const transaction of sortedTransactions) {
    const existingGroup = groups.get(transaction.date);
    if (existingGroup) {
      existingGroup.push(transaction);
    } else {
      groups.set(transaction.date, [transaction]);
    }
  }

  return Array.from(groups.entries()).map(([date, groupTransactions]) => ({
    date,
    displayDate: formatDisplayDate(date),
    transactions: groupTransactions,
  }));
}

function toSortableTime(timestamp: string): number {
  const time = Date.parse(timestamp);
  return Number.isNaN(time) ? 0 : time;
}
