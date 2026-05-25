export type SignedSolanaMessageResult = {
  signature: Uint8Array;
};

export type SignedSolanaTransactionResult = {
  signature: Uint8Array;
  transactionSignature?: string;
};
