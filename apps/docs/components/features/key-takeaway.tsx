import type { PropsWithChildren } from "react";

type KeyTakeawayProps = PropsWithChildren<{
  title?: string;
}>;

export default function KeyTakeaway({
  title = "Key takeaway",
  children,
}: KeyTakeawayProps) {
  return (
    <aside
      role="note"
      aria-label={title}
      className="my-6 rounded-lg border border-orange-300/40 bg-orange-50/60 p-4 dark:border-orange-500/40 dark:bg-orange-900/20"
    >
      <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
        {title}
      </p>
      <div className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
        {children}
      </div>
    </aside>
  );
}
