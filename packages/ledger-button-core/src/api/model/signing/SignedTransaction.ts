export interface SignedTransaction {
  hash?: string;
  rawTransaction: Uint8Array<ArrayBufferLike>;
  signedRawTransaction: string;
}
