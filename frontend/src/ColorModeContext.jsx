import { createContext, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "./theme";

// Контекст переключения светлой/тёмной темы.
export const ColorModeContext = createContext({ mode: "light", toggle: () => {} });

const STORAGE_KEY = "pt.colorMode";

/**
 * Провайдер темы: хранит режим в localStorage, отдаёт toggle через контекст
 * и оборачивает приложение в ThemeProvider + CssBaseline.
 */
export default function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "light",
  );

  const value = useMemo(
    () => ({
      mode,
      // Переключает режим и запоминает выбор в localStorage.
      toggle: () =>
        setMode((prev) => {
          const next = prev === "light" ? "dark" : "light";
          localStorage.setItem(STORAGE_KEY, next);
          return next;
        }),
    }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={getTheme(mode)}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
