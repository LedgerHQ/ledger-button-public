export function buildTransactionExplorerUrl(
  hash: string,
  transactionExplorerUrlTemplate?: string,
): string | null {
  if (!transactionExplorerUrlTemplate) {
    return null;
  }

  return transactionExplorerUrlTemplate.replaceAll("${hash}", hash);
}
