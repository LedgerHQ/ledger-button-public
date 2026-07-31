"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import {
  ChevronDown,
  ChevronRight,
  Settings,
} from "@ledgerhq/lumen-ui-react/symbols";

import { SOLANA_CLUSTERS, type SolanaCluster } from "./solanaCluster";

interface SolanaSettingsBlockProps {
  cluster: SolanaCluster;
  onClusterChange: (cluster: SolanaCluster) => void;
}

export function SolanaSettingsBlock({
  cluster,
  onClusterChange,
}: SolanaSettingsBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-muted overflow-hidden rounded-lg border border-dashed opacity-80 transition-opacity hover:opacity-100">
      <div
        className="hover:bg-muted-transparent flex cursor-pointer items-center justify-between px-24 py-14 transition-colors select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="body-2-semi-bold text-muted flex items-center gap-10">
          <Settings size={20} />
          Solana Configuration
        </h3>
        <span className="text-muted">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </div>

      {isExpanded && (
        <div className="border-muted bg-canvas border-t border-dashed p-24">
          <div className="grid grid-cols-2 gap-14">
            <Select
              items={SOLANA_CLUSTERS}
              value={cluster}
              onValueChange={(value) => {
                if (value) {
                  onClusterChange(value as SolanaCluster);
                }
              }}
            >
              <SelectTrigger label="Cluster" />
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
          <p className="body-4 text-muted mt-12">
            Switching the cluster reinitializes the Solana RPC connection.
          </p>
        </div>
      )}
    </div>
  );
}
