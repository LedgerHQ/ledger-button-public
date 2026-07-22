"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { type ColorSchemeName, ThemeProvider } from "@ledgerhq/lumen-ui-react";

interface ProvidersProps {
  children: ReactNode;
}

type ColorSchemeContextValue = {
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ColorSchemeName) => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export function useColorScheme(): ColorSchemeContextValue {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error("useColorScheme must be used within Providers");
  }
  return context;
}

export function Providers({ children }: ProvidersProps) {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>("system");

  const value = useMemo(() => ({ colorScheme, setColorScheme }), [colorScheme]);

  return (
    <ColorSchemeContext.Provider value={value}>
      <ThemeProvider colorScheme={colorScheme}>{children}</ThemeProvider>
    </ColorSchemeContext.Provider>
  );
}
