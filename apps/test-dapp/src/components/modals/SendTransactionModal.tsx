"use client";

import { useCallback, useRef } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

interface SendTransactionModalProps {
  onSubmit: (tx: string) => Promise<void>;
  onClose: () => void;
}

export function SendTransactionModal({
  onSubmit,
  onClose,
}: SendTransactionModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const value = textareaRef.current?.value;
    if (!value) {
      return;
    }
    onClose();
    await onSubmit(value);
  }, [onSubmit, onClose]);

  return (
    <div className="space-y-16">
      <div>
        <label className="block body-4-semi-bold text-muted mb-6">
          Transaction JSON
        </label>
        <textarea
          ref={textareaRef}
          className="w-full px-12 py-8 border border-muted rounded-lg body-4 font-mono bg-muted text-base placeholder:text-muted focus:outline-none focus:border-active"
          rows={5}
          placeholder='{"to": "0x...", "value": "0x0", "data": "0x..."}'
        />
      </div>
      <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
        Send Transaction
      </Button>
    </div>
  );
}