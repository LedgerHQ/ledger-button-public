"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
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
    <div className="border border-dashed border-muted rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
      <div
        className="flex justify-between items-center px-24 py-14 cursor-pointer select-none hover:bg-muted-transparent transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="flex items-center gap-10 body-2-semi-bold text-muted">
          <Settings size={20} />
          Solana Configuration
        </h3>
        <span className="text-muted">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </div>

      {isExpanded && (
        <div className="p-24 border-t border-dashed border-muted bg-canvas">
          <div className="grid grid-cols-2 gap-14">
            <Select
              value={cluster}
              onValueChange={(value) =>
                onClusterChange(value as SolanaCluster)
              }
            >
              <SelectTrigger label="Cluster" />
              <SelectContent>
                {SOLANA_CLUSTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <SelectItemText>{option.label}</SelectItemText>
                  </SelectItem>
                ))}
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
