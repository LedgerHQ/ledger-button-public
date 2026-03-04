"use client";

import { useCallback, useRef } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

interface SignPersonalMessageModalProps {
  onSubmit: (message: string) => Promise<void>;
  onClose: () => void;
}

export function SignPersonalMessageModal({
  onSubmit,
  onClose,
}: SignPersonalMessageModalProps) {
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
          Message
        </label>
        <textarea
          ref={textareaRef}
          className="w-full px-12 py-8 border border-muted rounded-lg body-2 bg-muted text-base font-mono placeholder:text-muted-subtle focus:outline-none focus:border-active resize-y"
          rows={3}
          placeholder="Enter your message..."
        />
      </div>
      <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
        Sign Message
      </Button>
    </div>
  );
}