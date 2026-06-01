"use client";

import { useCallback, useRef } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

interface SignSolanaMessageModalProps {
  onSubmit: (message: string) => Promise<void>;
  onClose: () => void;
}

export function SignSolanaMessageModal({
  onSubmit,
  onClose,
}: SignSolanaMessageModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const value = textareaRef.current?.value;
    if (!value) return;
    onClose();
    await onSubmit(value);
  }, [onSubmit, onClose]);

  return (
    <div className="space-y-16">
      <div>
        <textarea
          ref={textareaRef}
          className="w-full px-12 py-8 border border-muted rounded-lg body-2 bg-muted text-base placeholder:text-muted font-mono focus:outline-none focus:border-active resize-y"
          rows={5}
          placeholder="Hello from the Ledger test dApp on Solana!"
          defaultValue="Hello from the Ledger test dApp on Solana!"
        />
      </div>
      <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
        Sign Message
      </Button>
    </div>
  );
}
