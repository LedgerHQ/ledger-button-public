"use client";

import { useCallback, useRef, useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";

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
  "eth_call",
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
  const [method, setMethod] = useState<string>(PROVIDER_METHODS[0]);
  const paramsRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    if (!method) {
      return;
    }
    onClose();
    await onSubmit(method, paramsRef.current?.value || "[]");
  }, [onSubmit, onClose, method]);

  return (
    <div className="space-y-16">
      <Select value={method} onValueChange={(value) => setMethod(value)}>
        <SelectTrigger label="Method" />
        <SelectContent>
          {PROVIDER_METHODS.map((m) => (
            <SelectItem key={m} value={m}>
              <SelectItemText>{m}</SelectItemText>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div>
        <label className="block body-4-semi-bold text-muted mb-6">
          Params (JSON array)
        </label>
        <textarea
          ref={paramsRef}
          className="w-full px-12 py-8 border border-muted rounded-lg body-4 font-mono bg-muted text-base placeholder:text-muted focus:outline-none focus:border-active resize-y"
          rows={3}
          placeholder="[]"
        />
      </div>

      <Button appearance="accent" size="md" isFull onClick={handleSubmit}>
        Call provider.request()
      </Button>
    </div>
  );
}