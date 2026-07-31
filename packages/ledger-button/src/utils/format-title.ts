/**
 * Truncates a title string to a maximum length, appending an ellipsis when truncated.
 * Example: "Super loooooooooooooooooooooooooooooong Account name" -> "Super loooooooooooooooooooooooooo…"
 *
 * @param title - The title string to truncate
 * @param maxLength - Maximum number of characters before truncation (default: 30)
 * @returns The original string if within the limit, otherwise the truncated string with "…"
 */
export function formatTitle(title: string, maxLength = 30): string {
  if (title.length <= maxLength) {
    return title;
  }
  return `${title.slice(0, maxLength)}…`;
}
