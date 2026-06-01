export function buildExplorerTransactionUrl(
  transactionExplorerUrlTemplate: string | undefined,
  hash: string,
): string | null {
  if (!transactionExplorerUrlTemplate) {
    return null;
  }

  return transactionExplorerUrlTemplate.replaceAll("${hash}", hash);
}
