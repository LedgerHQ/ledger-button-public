"use client";

import { Button } from "@ledgerhq/lumen-ui-react";
import { useTheme } from "@ledgerhq/lumen-ui-react";

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
      {isDark ? "☀️" : "🌙"}
    </Button>
  );
}