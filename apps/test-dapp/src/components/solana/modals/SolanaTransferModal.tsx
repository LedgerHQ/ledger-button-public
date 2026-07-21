"use client";

import { useCallback, useState } from "react";
import { Button, TextInput } from "@ledgerhq/lumen-ui-react";

export interface SolanaTransferValues {
  recipient: string;
  lamports: number;
}

interface SolanaTransferModalProps {
  onSubmit: (values: SolanaTransferValues) => Promise<void>;
  onClose: () => void;
  submitLabel: string;
  defaultRecipient?: string;
  defaultLamports?: number;
  ownAddress?: string;
}

export function SolanaTransferModal({
  onSubmit,
  onClose,
  submitLabel,
  defaultRecipient = "",
  defaultLamports = 1000,
  ownAddress,
}: SolanaTransferModalProps) {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [lamports, setLamports] = useState(String(defaultLamports));
  const [error, setError] = useState<string | null>(null);

  const isSelfTransfer =
    ownAddress !== undefined && recipient.trim() === ownAddress;

  const useOwnAddress = useCallback(() => {
    if (!ownAddress) {
      return;
    }
    setRecipient(ownAddress);
  }, [ownAddress]);

  const handleSubmit = useCallback(async () => {
    const parsed = Number.parseInt(lamports, 10);
    if (!recipient.trim()) {
      setError("Recipient is required.");
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Lamports must be a positive integer.");
      return;
    }
    setError(null);
    onClose();
    await onSubmit({ recipient: recipient.trim(), lamports: parsed });
  }, [onSubmit, onClose, recipient, lamports]);

  return (
    <div className="space-y-16">
      <div className="space-y-8">
        <TextInput
          label="Recipient (base58 public key)"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="e.g. 4Nd1mYf8aRZ…"
        />
        {ownAddress && (
          <div className="flex items-center justify-between gap-8">
            <p className="body-4 text-muted">
              {isSelfTransfer
                ? "Self-transfer: recipient is your own address."
                : "Send to yourself to keep the funds (only the fee is spent)."}
            </p>
            <Button
              appearance="gray"
              size="sm"
              onClick={useOwnAddress}
              disabled={isSelfTransfer}
            >
              Use my address
            </Button>
          </div>
        )}
      </div>
      <TextInput
        label="Amount (lamports)"
        type="number"
        value={lamports}
        onChange={(e) => setLamports(e.target.value)}
        placeholder="1000"
      />
      <p className="body-4 text-muted">
        1 SOL = 1,000,000,000 lamports. On devnet you can request an airdrop
        with{" "}
        <span className="font-mono">
          solana airdrop 1 &lt;pubkey&gt; --url devnet
        </span>
        .
      </p>
      {error && (
        <div className="bg-error-transparent border-error rounded-lg border p-12">
          <code className="body-4 text-error font-mono">{error}</code>
        </div>
      )}
      <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}
