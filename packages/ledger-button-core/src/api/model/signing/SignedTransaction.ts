export interface SignedTransaction {
  hash: string | undefined;
  rawTransaction: Uint8Array<ArrayBufferLike>;
  signedRawTransaction: string;
}
