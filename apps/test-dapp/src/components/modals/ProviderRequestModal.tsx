"use client";

import { useCallback, useRef, useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  TextInput,
} from "@ledgerhq/lumen-ui-react";

const PROVIDER_METHODS = [
  // Locally handled
  "eth_accounts",
  "eth_requestAccounts",
  "eth_chainId",
  "eth_sign",
  "personal_sign",
  "eth_signTypedData",
  "eth_signTypedData_v4",
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_signRawTransaction",
  "eth_sendRawTransaction",
  "wallet_switchEthereumChain",
  // Broadcasted to node
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getCode",
  "eth_estimateGas",
  "eth_call",
  // Not supported by Ledger Button, triggers EIP error result
  "wallet_getCapabilities",
] as const;

interface ProviderRequestModalProps {
  onSubmit: (method: string, params: string) => Promise<void>;
  onClose: () => void;
}

const CUSTOM_METHOD_VALUE = "__custom__";

export function ProviderRequestModal({
  onSubmit,
  onClose,
}: ProviderRequestModalProps) {
  const [selectValue, setSelectValue] = useState<string>(PROVIDER_METHODS[0]);
  const [customMethod, setCustomMethod] = useState("");
  const paramsRef = useRef<HTMLTextAreaElement>(null);

  const isCustom = selectValue === CUSTOM_METHOD_VALUE;
  const resolvedMethod = isCustom ? customMethod : selectValue;

  const handleSubmit = useCallback(async () => {
    if (!resolvedMethod) {
      return;
    }
    onClose();
    await onSubmit(resolvedMethod, paramsRef.current?.value || "[]");
  }, [onSubmit, onClose, resolvedMethod]);

  return (
    <div className="space-y-16">
      <div className="space-y-10">
        <Select
          value={selectValue}
          onValueChange={(value) => setSelectValue(value)}
        >
          <SelectTrigger label="Method" />
          <SelectContent>
            {PROVIDER_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                <SelectItemText>{m}</SelectItemText>
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_METHOD_VALUE}>
              <SelectItemText>Custom…</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
        {isCustom && (
          <TextInput
            label="Custom method"
            type="text"
            value={customMethod}
            onChange={(e) => setCustomMethod(e.target.value)}
          />
        )}
      </div>

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
