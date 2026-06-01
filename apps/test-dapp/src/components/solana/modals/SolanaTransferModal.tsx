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
}

export function SolanaTransferModal({
  onSubmit,
  onClose,
  submitLabel,
  defaultRecipient = "",
  defaultLamports = 1000,
}: SolanaTransferModalProps) {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [lamports, setLamports] = useState(String(defaultLamports));
  const [error, setError] = useState<string | null>(null);

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
      <TextInput
        label="Recipient (base58 public key)"
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="e.g. 4Nd1mYf8aRZ…"
      />
      <TextInput
        label="Amount (lamports)"
        type="number"
        value={lamports}
        onChange={(e) => setLamports(e.target.value)}
        placeholder="1000"
      />
      <p className="body-4 text-muted">
        1 SOL = 1,000,000,000 lamports. On devnet you can request an airdrop
        with <span className="font-mono">solana airdrop 1 &lt;pubkey&gt; --url devnet</span>.
      </p>
      {error && (
        <div className="p-12 bg-error-transparent border border-error rounded-lg">
          <code className="body-4 font-mono text-error">{error}</code>
        </div>
      )}
      <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}
