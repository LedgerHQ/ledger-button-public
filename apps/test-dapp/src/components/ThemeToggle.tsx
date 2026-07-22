"use client";

import { Button, useTheme } from "@ledgerhq/lumen-ui-react";
import { Moon, Sun } from "@ledgerhq/lumen-ui-react/symbols";

import { useColorScheme } from "./Providers";

export function ThemeToggle() {
  const { colorScheme } = useTheme();
  const { setColorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";

  return (
    <Button
      appearance="no-background"
      size="sm"
      onClick={() => setColorScheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </Button>
  );
}
