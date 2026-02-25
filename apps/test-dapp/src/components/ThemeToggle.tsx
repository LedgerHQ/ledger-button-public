"use client";

import { Button } from "@ledgerhq/lumen-ui-react";
import { useTheme } from "@ledgerhq/lumen-ui-react";
import { Moon, Sun } from "@ledgerhq/lumen-ui-react/symbols";

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();

  const isDark = mode === "dark";

  return (
    <Button
      appearance="no-background"
      size="sm"
      onClick={toggleMode}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </Button>
  );
}