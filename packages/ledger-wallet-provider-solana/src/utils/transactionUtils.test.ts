import {
  address,
  getBase58Decoder,
  getCompiledTransactionMessageDecoder,
  getCompiledTransactionMessageEncoder,
  getTransactionDecoder,
} from "@solana/kit";
import { describe, expect, it } from "vitest";

import {
  getSolanaMessageBytes,
  getSolanaTransactionRecipient,
  patchRecentBlockhash,
} from "./transactionUtils";

const ACCOUNT_KEY = new Uint8Array(32).fill(9);
const ORIGINAL_BLOCKHASH = new Uint8Array(32).fill(3);
const FEE_PAYER = address("11111111111111111111111111111111");

/** Legacy compiled message: header, one account, blockhash, zero instructions. */
const messageBytes = new Uint8Array([
  1,
  0,
  0,
  1,
  ...ACCOUNT_KEY,
  ...ORIGINAL_BLOCKHASH,
  0,
]);

const placeholderWireTransaction = new Uint8Array([
  1,
  ...new Uint8Array(64),
  ...messageBytes,
]);

describe("getSolanaMessageBytes", () => {
  it("strips the signature envelope from a wire transaction", () => {
    expect(getSolanaMessageBytes(placeholderWireTransaction)).toEqual(
      messageBytes,
    );
  });
});

describe("getSolanaTransactionRecipient", () => {
  const COMPUTE_BUDGET = "ComputeBudget111111111111111111111111111111";
  const SYSTEM_PROGRAM = "11111111111111111111111111111111";
  const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  const ASSOCIATED_TOKEN_PROGRAM =
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
  const SENDER = "So11111111111111111111111111111111111111112";
  const JUPITER = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

  const aWireTransaction = (
    staticAccounts: string[],
    instructions: {
      programAddressIndex: number;
      accountIndices?: number[];
      data?: Uint8Array;
    }[],
  ): Uint8Array =>
    new Uint8Array([
      1,
      ...new Uint8Array(64),
      ...getCompiledTransactionMessageEncoder().encode({
        version: "legacy",
        header: {
          numSignerAccounts: 1,
          numReadonlySignerAccounts: 0,
          numReadonlyNonSignerAccounts: 1,
        },
        staticAccounts: staticAccounts.map((account) => address(account)),
        lifetimeToken: getBase58Decoder().decode(ORIGINAL_BLOCKHASH),
        instructions,
      }),
    ]);

  it("joins every program except Compute Budget, System, Token, Token-2022, and Associated Token", () => {
    const wireTransaction = aWireTransaction(
      [
        SENDER,
        COMPUTE_BUDGET,
        SYSTEM_PROGRAM,
        TOKEN_PROGRAM,
        TOKEN_2022_PROGRAM,
        ASSOCIATED_TOKEN_PROGRAM,
        JUPITER,
      ],
      [
        { programAddressIndex: 1, data: new Uint8Array([2]) },
        { programAddressIndex: 2, accountIndices: [0] },
        { programAddressIndex: 3, accountIndices: [0] },
        { programAddressIndex: 4, accountIndices: [0] },
        { programAddressIndex: 5, accountIndices: [0] },
        { programAddressIndex: 6, accountIndices: [0] },
      ],
    );

    expect(getSolanaTransactionRecipient(wireTransaction).extract()).toBe(
      JUPITER,
    );
  });

  it("is empty when every instruction calls an ignored program", () => {
    const wireTransaction = aWireTransaction(
      [SENDER, COMPUTE_BUDGET, SYSTEM_PROGRAM, TOKEN_PROGRAM],
      [
        { programAddressIndex: 1, data: new Uint8Array([2]) },
        { programAddressIndex: 2, accountIndices: [0] },
        { programAddressIndex: 3, accountIndices: [0] },
      ],
    );

    expect(getSolanaTransactionRecipient(wireTransaction).isNothing()).toBe(
      true,
    );
  });

  it("is empty when the transaction cannot be decoded", () => {
    expect(
      getSolanaTransactionRecipient(new Uint8Array([1, 2, 3])).isNothing(),
    ).toBe(true);
  });
});

describe("patchRecentBlockhash", () => {
  it("replaces the 32-byte recentBlockhash in a compiled message", () => {
    const refreshed = new Uint8Array(32).fill(8);
    const patched = patchRecentBlockhash(messageBytes, refreshed);
    const decoded = getTransactionDecoder().decode(
      new Uint8Array([1, ...new Uint8Array(64), ...patched]),
    );

    expect(patched).not.toEqual(messageBytes);
    expect(Array.from(decoded.messageBytes.slice(36, 68))).toEqual(
      Array.from(refreshed),
    );
  });

  it("replaces the lifetime token of a v1 compiled message", () => {
    const original = new Uint8Array(
      getCompiledTransactionMessageEncoder().encode({
        configMask: 0,
        configValues: [],
        header: {
          numReadonlyNonSignerAccounts: 0,
          numReadonlySignerAccounts: 0,
          numSignerAccounts: 1,
        },
        instructionHeaders: [],
        instructionPayloads: [],
        lifetimeToken: getBase58Decoder().decode(ORIGINAL_BLOCKHASH),
        numInstructions: 0,
        numStaticAccounts: 1,
        staticAccounts: [FEE_PAYER],
        version: 1,
      }),
    );
    const refreshed = new Uint8Array(32).fill(8);
    const patched = patchRecentBlockhash(original, refreshed);
    const decoded = getCompiledTransactionMessageDecoder().decode(patched);

    expect(decoded.version).toBe(1);
    expect(decoded.lifetimeToken).toBe(getBase58Decoder().decode(refreshed));
    expect(decoded.staticAccounts).toEqual([FEE_PAYER]);
  });

  it("rejects a blockhash that is not 32 bytes", () => {
    expect(() => patchRecentBlockhash(messageBytes, new Uint8Array(31))).toThrow(
      /32 bytes/,
    );
  });
});
