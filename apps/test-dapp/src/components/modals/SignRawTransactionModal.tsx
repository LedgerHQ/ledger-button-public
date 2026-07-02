"use client";

import { useCallback, useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

import { fetchRandomUnsignedRawTx } from "../../lib/etherscan";

interface SignRawTransactionModalProps {
  onSubmit: (rawTx: string) => Promise<void>;
  onClose: () => void;
}

export function SignRawTransactionModal({
  onSubmit,
  onClose,
}: SignRawTransactionModalProps) {
  const [value, setValue] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchRandom = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    setHash(null);
    try {
      const { rawTx, hash: txHash } = await fetchRandomUnsignedRawTx();
      setValue(rawTx);
      setHash(txHash);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transaction",
      );
    } finally {
      setIsFetching(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!value) {
      return;
    }
    onClose();
    await onSubmit(value);
  }, [onSubmit, onClose, value]);

  return (
    <div className="space-y-16">
      <div className="space-y-8">
        <textarea
          className="border-muted body-2 bg-muted placeholder:text-muted focus:border-active w-full resize-y rounded-lg border px-12 py-8 font-mono text-base focus:outline-none"
          rows={5}
          placeholder="0x..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {hash && (
          <p className="body-4 text-muted break-all">
            Source tx:{" "}
            <a
              href={`https://etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {hash}
            </a>
          </p>
        )}
        {error && <p className="body-4 text-error">{error}</p>}
      </div>
      <div className="space-y-8">
        <Button
          appearance="gray"
          size="md"
          isFull
          disabled={isFetching}
          onClick={handleFetchRandom}
        >
          {isFetching ? "Fetching..." : "Random tx (Etherscan)"}
        </Button>
        <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
          Sign Raw TX
        </Button>
      </div>
    </div>
  );
}
