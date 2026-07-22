"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
  Tag,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import {
  ChevronDown,
  ChevronRight,
  Settings,
} from "@ledgerhq/lumen-ui-react/symbols";

import {
  ALL_WALLET_FEATURES,
  type LedgerProviderConfig,
  type TransactionConfirmationNotification,
  type WalletTransactionFeature,
} from "../hooks/useProviders";

interface SettingsBlockProps {
  config: LedgerProviderConfig;
  onConfigChange: (config: LedgerProviderConfig) => void;
  isProviderInitialized: boolean;
  onReinitialize: (newConfig?: LedgerProviderConfig) => void;
}

const DAPP_IDENTIFIERS = [
  { value: "ledger", label: "Ledger" },
  { value: "1inch", label: "1inch" },
  { value: "custom", label: "Custom…" },
];

const BUTTON_POSITIONS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "middle-right", label: "Middle Right" },
];

const LOG_LEVELS = [
  { value: "debug", label: "Debug" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Warn" },
  { value: "error", label: "Error" },
];

const ENVIRONMENTS = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
];

const CONFIRMATION_NOTIFICATION_MODES: {
  value: TransactionConfirmationNotification;
  label: string;
}[] = [
  { value: "tooltip", label: "Tooltip" },
  { value: "toast", label: "Toast" },
];

export function SettingsBlock({
  config,
  onConfigChange,
  isProviderInitialized,
  onReinitialize,
}: SettingsBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localConfig, setLocalConfig] = useState<LedgerProviderConfig>(config);
  const [lastAppliedConfig, setLastAppliedConfig] =
    useState<LedgerProviderConfig>(config);
  const [customDappId, setCustomDappId] = useState("");
  const [isCustomDapp, setIsCustomDapp] = useState(
    () =>
      !DAPP_IDENTIFIERS.some(
        (d) => d.value !== "custom" && d.value === config.dAppIdentifier,
      ),
  );

  const dappSelectValue = isCustomDapp ? "custom" : localConfig.dAppIdentifier;

  useEffect(() => {
    setLocalConfig(config);
    setLastAppliedConfig(config);
  }, [config]);

  const handleInputChange = useCallback(
    (field: keyof LedgerProviderConfig, value: string) => {
      setLocalConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleDappSelectChange = useCallback(
    (value: string) => {
      if (value === "custom") {
        setIsCustomDapp(true);
        setCustomDappId(localConfig.dAppIdentifier);
      } else {
        setIsCustomDapp(false);
        handleInputChange("dAppIdentifier", value);
      }
    },
    [localConfig.dAppIdentifier, handleInputChange],
  );

  const handleCustomDappChange = useCallback(
    (value: string) => {
      setCustomDappId(value);
      handleInputChange("dAppIdentifier", value);
    },
    [handleInputChange],
  );

  const handleToggleFeature = useCallback(
    (feature: WalletTransactionFeature) => {
      setLocalConfig((prev) => {
        const features = prev.walletTransactionFeatures;
        const next = features.includes(feature)
          ? features.filter((f) => f !== feature)
          : [...features, feature];
        return { ...prev, walletTransactionFeatures: next };
      });
    },
    [],
  );

  const handleConfirmationModeChange = useCallback(
    (mode: TransactionConfirmationNotification) => {
      setLocalConfig((prev) => ({
        ...prev,
        transactionConfirmationNotification: mode,
      }));
    },
    [],
  );

  const handleApply = useCallback(() => {
    onConfigChange(localConfig);
    setLastAppliedConfig(localConfig);
    if (isProviderInitialized) {
      onReinitialize(localConfig);
    }
  }, [localConfig, onConfigChange, isProviderInitialized, onReinitialize]);

  const hasChanges =
    JSON.stringify(localConfig) !== JSON.stringify(lastAppliedConfig);

  return (
    <div className="border-muted overflow-hidden rounded-lg border border-dashed opacity-80 transition-opacity hover:opacity-100">
      <div
        className="hover:bg-muted-transparent flex cursor-pointer items-center justify-between px-24 py-14 transition-colors select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-10">
          <h3 className="body-2-semi-bold text-muted flex items-center gap-10">
            <Settings size={20} />
            Provider Configuration
          </h3>
          {hasChanges && <Tag appearance="warning" size="sm" label="Unsaved" />}
          <Tag
            appearance="gray"
            size="sm"
            label={
              lastAppliedConfig.transactionConfirmationNotification === "toast"
                ? "Confirm: Toast"
                : "Confirm: Tooltip"
            }
          />
        </div>
        <span className="text-muted">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </div>

      {isExpanded && (
        <div className="border-muted bg-canvas space-y-16 border-t border-dashed p-24">
          <div className="grid grid-cols-2 gap-14">
            <div className="flex flex-col gap-10">
              <Select
                items={DAPP_IDENTIFIERS}
                value={dappSelectValue}
                onValueChange={(value) => {
                  if (value) {
                    handleDappSelectChange(value);
                  }
                }}
              >
                <SelectTrigger label="dApp identifier" />
                <SelectContent>
                  <SelectList
                    renderItem={(item) => (
                      <SelectItem key={item.value} value={item.value}>
                        <SelectItemText>{item.label}</SelectItemText>
                      </SelectItem>
                    )}
                  />
                </SelectContent>
              </Select>
              {dappSelectValue === "custom" && (
                <TextInput
                  label="Custom identifier"
                  type="text"
                  value={customDappId}
                  onChange={(e) => handleCustomDappChange(e.target.value)}
                />
              )}
            </div>

            <TextInput
              label="API Key"
              type="text"
              value={localConfig.apiKey}
              onChange={(e) => handleInputChange("apiKey", e.target.value)}
              placeholder="Enter your API key"
            />
          </div>

          <div className="grid grid-cols-3 gap-14">
            <div className="flex flex-col gap-10">
              <Select
                items={BUTTON_POSITIONS}
                value={localConfig.buttonPosition}
                onValueChange={(value) => {
                  if (value) {
                    handleInputChange("buttonPosition", value);
                  }
                }}
                disabled={localConfig.hideButton}
              >
                <SelectTrigger label="Button Position" />
                <SelectContent>
                  <SelectList
                    renderItem={(item) => (
                      <SelectItem key={item.value} value={item.value}>
                        <SelectItemText>{item.label}</SelectItemText>
                      </SelectItem>
                    )}
                  />
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    hideButton: !prev.hideButton,
                  }))
                }
                className={`body-2-semi-bold cursor-pointer rounded-lg border px-14 py-8 transition-colors ${
                  !localConfig.hideButton
                    ? "border-active bg-muted-transparent text-base"
                    : "border-muted bg-canvas text-muted"
                }`}
              >
                {localConfig.hideButton
                  ? "Floating Button: Off"
                  : "Floating Button: On"}
              </button>
            </div>

            <Select
              items={LOG_LEVELS}
              value={localConfig.logLevel}
              onValueChange={(value) => {
                if (value) {
                  handleInputChange("logLevel", value);
                }
              }}
            >
              <SelectTrigger label="Log Level" />
              <SelectContent>
                <SelectList
                  renderItem={(item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <SelectItemText>{item.label}</SelectItemText>
                    </SelectItem>
                  )}
                />
              </SelectContent>
            </Select>

            <Select
              items={ENVIRONMENTS}
              value={localConfig.environment}
              onValueChange={(value) => {
                if (value) {
                  handleInputChange("environment", value);
                }
              }}
            >
              <SelectTrigger label="Environment" />
              <SelectContent>
                <SelectList
                  renderItem={(item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <SelectItemText>{item.label}</SelectItemText>
                    </SelectItem>
                  )}
                />
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-10">
            <h4 className="body-2-semi-bold text-muted tracking-wider uppercase">
              Transaction confirmation
            </h4>
            <p className="body-2 text-muted">
              How on-chain confirmation is shown after a pending transaction
              settles. Click Apply &amp; Reinitialize to switch modes.
            </p>
            <div className="flex flex-wrap gap-8">
              {CONFIRMATION_NOTIFICATION_MODES.map((mode) => {
                const isActive =
                  localConfig.transactionConfirmationNotification ===
                  mode.value;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => handleConfirmationModeChange(mode.value)}
                    className={`body-2-semi-bold cursor-pointer rounded-lg border px-14 py-8 transition-colors ${
                      isActive
                        ? "border-active bg-muted-transparent text-base"
                        : "border-muted bg-canvas text-muted"
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-10">
            <h4 className="body-2-semi-bold text-muted tracking-wider uppercase">
              Wallet Actions
            </h4>
            <div className="flex flex-wrap gap-8">
              {ALL_WALLET_FEATURES.map((feature) => {
                const isActive =
                  localConfig.walletTransactionFeatures.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => handleToggleFeature(feature)}
                    className={`body-2-semi-bold cursor-pointer rounded-lg border px-14 py-8 capitalize transition-colors ${
                      isActive
                        ? "border-active bg-muted-transparent text-base"
                        : "border-muted bg-canvas text-muted"
                    }`}
                  >
                    {feature}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            appearance={hasChanges ? "accent" : "gray"}
            size="md"
            onClick={handleApply}
            disabled={!hasChanges}
          >
            {hasChanges ? "Apply & Reinitialize" : "No Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
