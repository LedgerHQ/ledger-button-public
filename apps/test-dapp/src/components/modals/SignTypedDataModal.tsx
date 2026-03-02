"use client";

import { useCallback, useRef } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

interface SignTypedDataModalProps {
  onSubmit: (typedData: string) => Promise<void>;
  onClose: () => void;
}

export function SignTypedDataModal({
  onSubmit,
  onClose,
}: SignTypedDataModalProps) {
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
          Typed Data (EIP-712 JSON)
        </label>
        <textarea
          ref={textareaRef}
          className="w-full px-12 py-8 border border-muted rounded-lg body-2 font-mono bg-muted text-base placeholder:text-muted focus:outline-none focus:border-active transition-colors"
          rows={5}
          placeholder='{"types": {...}, "primaryType": "...", "domain": {...}, "message": {...}}'
        />
      </div>
      <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
        Sign Typed Data
      </Button>
    </div>
  );
}