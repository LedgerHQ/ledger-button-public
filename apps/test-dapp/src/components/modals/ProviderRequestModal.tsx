"use client";

import { useCallback, useRef } from "react";
import {
  DialogPanel,
  DialogTitle,
  Field,
  Fieldset,
  Label,
  Select,
  Textarea,
} from "@headlessui/react";

import styles from "../TransactionsBlock.module.css";

const PROVIDER_METHODS = [
  "eth_accounts",
  "eth_requestAccounts",
  "eth_chainId",
  "eth_signTransaction",
  "eth_sendTransaction",
  "eth_signRawTransaction",
  "eth_sendRawTransaction",
  "eth_sign",
  "personal_sign",
  "eth_signTypedData",
  "eth_signTypedData_v4",
  "eth_getBalance",
  "eth_getBlockByNumber",
  "eth_estimateGas",
  "eth_getTransactionCount",
  "eth_maxPriorityFeePerGas",
  "wallet_switchEthereumChain",
  "wallet_getCapabilities", //Not supported by Ledger Button, test for EIP error result
] as const;

interface ProviderRequestModalProps {
  onSubmit: (method: string, params: string) => Promise<void>;
  onClose: () => void;
}

export function ProviderRequestModal({
  onSubmit,
  onClose,
}: ProviderRequestModalProps) {
  const methodRef = useRef<HTMLSelectElement>(null);
  const paramsRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const method = methodRef.current?.value;
    if (!method) {
      return;
    }
    onClose();
    await onSubmit(method, paramsRef.current?.value || "[]");
  }, [onSubmit, onClose]);

  return (
    <DialogPanel transition className={styles["transactions__dialog-panel"]}>
      <DialogTitle as="h3" className={styles["transactions__dialog-title"]}>
        Provider Request
      </DialogTitle>
      <Fieldset>
        <Field className={styles["transactions__field"]}>
          <Label className={styles["transactions__label"]}>Method</Label>
          <Select ref={methodRef} className={styles["transactions__select"]}>
            {PROVIDER_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </Field>
        <Field className={styles["transactions__field"]}>
          <Label className={styles["transactions__label"]}>
            Params (JSON array)
          </Label>
          <Textarea
            ref={paramsRef}
            className={styles["transactions__textarea"]}
            rows={3}
            placeholder="[]"
          />
        </Field>
      </Fieldset>
      <button
        className={styles["transactions__submit-button"]}
        onClick={handleSubmit}
      >
        Call provider.request()
      </button>
    </DialogPanel>
  );
}
