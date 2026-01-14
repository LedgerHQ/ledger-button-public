"use client";

import { useCallback, useRef } from "react";
import { DialogPanel, DialogTitle, Field, Textarea } from "@headlessui/react";

import styles from "../TransactionsBlock.module.css";

interface SignPersonalMessageModalProps {
  onSubmit: (message: string) => Promise<void>;
  onClose: () => void;
}

export function SignPersonalMessageModal({ onSubmit, onClose }: SignPersonalMessageModalProps) {
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
    <DialogPanel transition className={styles["transactions__dialog-panel"]}>
      <DialogTitle as="h3" className={styles["transactions__dialog-title"]}>
        Sign Personal Message
      </DialogTitle>
      <Field>
        <Textarea
          ref={textareaRef}
          className={styles["transactions__textarea"]}
          rows={3}
          placeholder="Enter your message..."
        />
      </Field>
      <button
        className={styles["transactions__submit-button"]}
        onClick={handleSubmit}
      >
        Sign Message
      </button>
    </DialogPanel>
  );
}
