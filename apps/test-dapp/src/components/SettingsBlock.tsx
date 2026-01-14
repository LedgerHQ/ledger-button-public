"use client";

import { useCallback, useState } from "react";
import {
  Field,
  Fieldset,
  Input,
  Label,
  Select,
} from "@headlessui/react";

import type { LedgerProviderConfig } from "../hooks/useProviders";

import blockStyles from "./Block.module.css";
import styles from "./SettingsBlock.module.css";

interface SettingsBlockProps {
  config: LedgerProviderConfig;
  onConfigChange: (config: LedgerProviderConfig) => void;
  isProviderInitialized: boolean;
  onReinitialize: () => void;
}

export function SettingsBlock({
  config,
  onConfigChange,
  isProviderInitialized,
  onReinitialize,
}: SettingsBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localConfig, setLocalConfig] = useState<LedgerProviderConfig>(config);

  const handleInputChange = useCallback(
    (field: keyof LedgerProviderConfig, value: string) => {
      setLocalConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleApply = useCallback(() => {
    onConfigChange(localConfig);
    if (isProviderInitialized) {
      onReinitialize();
    }
  }, [localConfig, onConfigChange, isProviderInitialized, onReinitialize]);

  const hasChanges =
    JSON.stringify(localConfig) !== JSON.stringify(config);

  return (
    <div className={blockStyles.block}>
      <div
        className={blockStyles["block__header"]}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className={blockStyles["block__title"]}>
          <span className={blockStyles["block__icon"]}>⚙️</span>
          Settings / Configuration
        </h3>
        <span className={blockStyles["block__toggle"]}>{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div className={blockStyles["block__content"]}>
          <Fieldset className={styles["settings-block__fieldset"]}>
            <Field className={styles["settings-block__field"]}>
              <Label className={styles["settings-block__label"]}>dApp Identifier</Label>
              <Input
                className={styles["settings-block__input"]}
                type="text"
                value={localConfig.dAppIdentifier}
                onChange={(e) =>
                  handleInputChange("dAppIdentifier", e.target.value)
                }
                placeholder="e.g., 1inch"
              />
            </Field>

            <Field className={styles["settings-block__field"]}>
              <Label className={styles["settings-block__label"]}>API Key</Label>
              <Input
                className={styles["settings-block__input"]}
                type="text"
                value={localConfig.apiKey}
                onChange={(e) => handleInputChange("apiKey", e.target.value)}
                placeholder="Enter your API key"
              />
            </Field>

            <Field className={styles["settings-block__field"]}>
              <Label className={styles["settings-block__label"]}>Button Position</Label>
              <Select
                className={styles["settings-block__select"]}
                value={localConfig.buttonPosition}
                onChange={(e) =>
                  handleInputChange("buttonPosition", e.target.value)
                }
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </Select>
            </Field>

            <Field className={styles["settings-block__field"]}>
              <Label className={styles["settings-block__label"]}>Log Level</Label>
              <Select
                className={styles["settings-block__select"]}
                value={localConfig.logLevel}
                onChange={(e) =>
                  handleInputChange("logLevel", e.target.value)
                }
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </Select>
            </Field>

            <Field className={styles["settings-block__field"]}>
              <Label className={styles["settings-block__label"]}>Environment</Label>
              <Select
                className={styles["settings-block__select"]}
                value={localConfig.environment}
                onChange={(e) =>
                  handleInputChange("environment", e.target.value)
                }
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
              </Select>
            </Field>
          </Fieldset>

          <div className={styles["settings-block__actions"]}>
            <button
              className={styles["settings-block__apply-button"]}
              onClick={handleApply}
              disabled={!hasChanges}
            >
              {hasChanges ? "Apply Changes" : "No Changes"}
            </button>
            {hasChanges && isProviderInitialized && (
              <p className={styles["settings-block__hint"]}>
                Provider will be reinitialized with new settings
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
