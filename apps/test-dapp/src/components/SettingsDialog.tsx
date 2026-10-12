"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
  Tag,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { Settings } from "@ledgerhq/lumen-ui-react/symbols";
import { usePathname } from "next/navigation";

import {
  ALL_WALLET_FEATURES,
  DEFAULT_TRIAL_API_KEY,
  type LedgerProviderConfig,
  setTrialModeAndReload,
  type TransactionConfirmationNotification,
  useProviders,
  type WalletTransactionFeature,
} from "../hooks/useProviders";
import {
  SOLANA_CLUSTERS,
  type SolanaCluster,
  useSolanaClusterConfig,
} from "./solana";

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

export function SettingsDialog() {
  const { config, setConfig, isInitialized, reinitialize } = useProviders();
  const { cluster, setCluster } = useSolanaClusterConfig();
  const pathname = usePathname() ?? "/";
  const isSolana = pathname.startsWith("/solana");

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
  const isTrialApplied = config.environment === "trial";
  const [isTrialEnabled, setIsTrialEnabled] = useState(isTrialApplied);
  const [trialApiKey, setTrialApiKey] = useState(
    isTrialApplied ? config.apiKey : DEFAULT_TRIAL_API_KEY,
  );

  useEffect(() => {
    setLocalConfig(config);
    setLastAppliedConfig(config);
    setIsTrialEnabled(config.environment === "trial");
    setTrialApiKey(
      config.environment === "trial" ? config.apiKey : DEFAULT_TRIAL_API_KEY,
    );
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

  const trialChanged =
    isTrialEnabled !== isTrialApplied ||
    (isTrialEnabled && trialApiKey.trim() !== config.apiKey);

  const handleApply = useCallback(() => {
    if (trialChanged) {
      setTrialModeAndReload(isTrialEnabled ? trialApiKey.trim() : null);
      return;
    }
    setConfig(localConfig);
    setLastAppliedConfig(localConfig);
    if (isInitialized) {
      reinitialize(localConfig);
    }
  }, [
    trialChanged,
    isTrialEnabled,
    trialApiKey,
    localConfig,
    setConfig,
    isInitialized,
    reinitialize,
  ]);

  const hasChanges =
    trialChanged ||
    JSON.stringify(localConfig) !== JSON.stringify(lastAppliedConfig);
  const trialKeyMissing = isTrialEnabled && trialApiKey.trim() === "";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          appearance="no-background"
          size="sm"
          aria-label="Open configuration"
        >
          <Settings size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader
          title="Configuration"
          description="Shared Ledger Button provider settings"
        />
        <DialogBody className="space-y-16">
          <div className="flex flex-col gap-16">
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

            {!isTrialEnabled && (
              <TextInput
                label="API Key"
                type="text"
                value={localConfig.apiKey}
                onChange={(e) => handleInputChange("apiKey", e.target.value)}
                placeholder="Enter your API key"
              />
            )}
          </div>

          <div className="flex flex-col gap-16">
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

            <button
              type="button"
              onClick={() => setIsTrialEnabled((prev) => !prev)}
              className={`body-2-semi-bold cursor-pointer rounded-lg border px-14 py-8 transition-colors ${
                isTrialEnabled
                  ? "border-active bg-muted-transparent text-base"
                  : "border-muted bg-canvas text-muted"
              }`}
            >
              {isTrialEnabled ? "Trial mode: On" : "Trial mode: Off"}
            </button>
            {!isTrialEnabled && (
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
            )}
            {isTrialEnabled && (
              <div className="flex flex-col gap-8">
                <TextInput
                  label="Trial API key"
                  type="text"
                  value={trialApiKey}
                  onChange={(e) => setTrialApiKey(e.target.value)}
                  placeholder="Paste the trial key"
                />
                <p className="body-4 text-muted">
                  Generate one{" "}
                  <a
                    href="https://connect-dashboard.aws.stg.ldg-tech.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-base underline"
                  >
                    here
                  </a>
                  .
                </p>
              </div>
            )}
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

          {isSolana && (
            <div className="space-y-10">
              <h4 className="body-2-semi-bold text-muted tracking-wider uppercase">
                Network
              </h4>
              <Select
                items={SOLANA_CLUSTERS}
                value={cluster}
                onValueChange={(value) => {
                  if (value) {
                    setCluster(value as SolanaCluster);
                  }
                }}
              >
                <SelectTrigger label="Solana Cluster" />
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
              <p className="body-4 text-muted">
                Switching the cluster reinitializes the Solana RPC connection.
              </p>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {hasChanges && <Tag appearance="warning" size="sm" label="Unsaved" />}
          <Button
            appearance={hasChanges && !trialKeyMissing ? "accent" : "gray"}
            size="md"
            onClick={handleApply}
            disabled={!hasChanges || trialKeyMissing}
          >
            {trialKeyMissing
              ? "Enter a trial API key"
              : trialChanged
                ? "Apply & Reload"
                : hasChanges
                  ? "Apply & Reinitialize"
                : "No Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
