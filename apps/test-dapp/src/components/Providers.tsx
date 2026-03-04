"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@ledgerhq/lumen-ui-react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <ThemeProvider defaultMode="system">{children}</ThemeProvider>;
}