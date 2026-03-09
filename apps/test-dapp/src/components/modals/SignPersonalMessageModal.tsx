"use client";

import { useCallback, useRef } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

const PRESET_MESSAGES = [
  {
    label: "Short",
    message: "Hello\n\nI'm a personal message",
  },
  {
    label: "Medium",
    message: `Welcome to Example dApp!

Please sign this message to verify your identity.

Wallet address: 0x1234...abcd
Nonce: 8a3f29c1
Issued at: 2026-03-04T12:00:00Z`,
  },
  {
    label: "Long",
    message: `By signing this message, you agree to the following terms:

1. You confirm that you are the owner of the connected wallet.
2. You authorize this dApp to verify your identity using your cryptographic signature.
3. This signature will not trigger any blockchain transaction or cost any gas fees.
4. Your signature may be stored off-chain for authentication purposes.
5. You acknowledge that you have read and understood the Terms of Service available at https://example.com/tos.

This request will not trigger a blockchain transaction or cost any gas fees.

Nonce: f7b29a4e-3d1c-4f8a-b5e6-9c2d8a1f3e7b
Timestamp: 2026-03-04T12:00:00.000Z
Chain ID: 1
Version: 1`,
  },
];

interface SignPersonalMessageModalProps {
  onSubmit: (message: string) => Promise<void>;
  onClose: () => void;
}

export function SignPersonalMessageModal({
  onSubmit,
  onClose,
}: SignPersonalMessageModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePresetSubmit = useCallback(
    async (message: string) => {
      onClose();
      await onSubmit(message);
    },
    [onSubmit, onClose],
  );

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
          Quick sign
        </label>
        <div className="flex gap-8">
          {PRESET_MESSAGES.map((preset) => (
            <Button
              key={preset.label}
              appearance="gray"
              size="sm"
              onClick={() => handlePresetSubmit(preset.message)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex-1 h-px bg-muted" />
        <span className="text-muted-subtle body-4">or write your own</span>
        <div className="flex-1 h-px bg-muted" />
      </div>

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