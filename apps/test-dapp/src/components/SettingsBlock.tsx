"use client";

import { useCallback, useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  Tag,
  TextInput,
} from "@ledgerhq/lumen-ui-react";

import {
  ALL_WALLET_FEATURES,
  type LedgerProviderConfig,
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

  const isPresetDapp = DAPP_IDENTIFIERS.some(
    (d) => d.value !== "custom" && d.value === localConfig.dAppIdentifier,
  );
  const dappSelectValue = isPresetDapp ? localConfig.dAppIdentifier : "custom";

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
        setCustomDappId(localConfig.dAppIdentifier);
      } else {
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
    <div className="border border-dashed border-muted rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
      <div
        className="flex justify-between items-center px-24 py-14 cursor-pointer select-none hover:bg-muted-transparent transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-10">
          <h3 className="flex items-center gap-10 body-2-semi-bold text-muted">
            <span>⚙️</span>
            Provider Configuration
          </h3>
          {hasChanges && (
            <Tag appearance="warning" size="sm" label="Unsaved" />
          )}
        </div>
        <span className="body-2 text-muted">{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div className="p-24 border-t border-dashed border-muted bg-canvas space-y-16">
          <div className="grid grid-cols-2 gap-14">
            <div className="flex flex-col gap-10">
              <Select
                value={dappSelectValue}
                onValueChange={handleDappSelectChange}
              >
                <SelectTrigger label="dApp identifier" />
                <SelectContent>
                  {DAPP_IDENTIFIERS.map((dapp) => (
                    <SelectItem key={dapp.value} value={dapp.value}>
                      <SelectItemText>{dapp.label}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dappSelectValue === "custom" && (
                <TextInput
                  label="Custom identifier"
                  type="text"
                  value={customDappId}
                  onChange={(e) => handleCustomDappChange(e.target.value)}
                  placeholder="Enter custom dApp identifier"
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
            <Select
              value={localConfig.buttonPosition}
              onValueChange={(value) =>
                handleInputChange("buttonPosition", value)
              }
            >
              <SelectTrigger label="Button Position" />
              <SelectContent>
                {BUTTON_POSITIONS.map((pos) => (
                  <SelectItem key={pos.value} value={pos.value}>
                    <SelectItemText>{pos.label}</SelectItemText>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={localConfig.logLevel}
              onValueChange={(value) => handleInputChange("logLevel", value)}
            >
              <SelectTrigger label="Log Level" />
              <SelectContent>
                {LOG_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <SelectItemText>{level.label}</SelectItemText>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={localConfig.environment}
              onValueChange={(value) =>
                handleInputChange("environment", value)
              }
            >
              <SelectTrigger label="Environment" />
              <SelectContent>
                {ENVIRONMENTS.map((env) => (
                  <SelectItem key={env.value} value={env.value}>
                    <SelectItemText>{env.label}</SelectItemText>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-10">
            <h4 className="body-2-semi-bold text-muted uppercase tracking-wider">
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
                    className={`px-14 py-8 rounded-lg body-2-semi-bold capitalize cursor-pointer transition-colors border ${
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
