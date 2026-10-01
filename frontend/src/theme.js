import { createTheme, alpha } from "@mui/material/styles";

const INDIGO = "#6366F1";

/**
 * Создаёт тему MUI для светлого или тёмного режима.
 * @param {"light" | "dark"} mode — активный цветовой режим
 */
export function getTheme(mode) {
  const isLight = mode === "light";
  return createTheme({
    palette: {
      mode,
      primary: { main: INDIGO, contrastText: "#fff" },
      secondary: { main: "#14B8A6" },
      success: { main: "#22C55E" },
      error: { main: "#EF4444" },
      background: {
        default: isLight ? "#F6F7FB" : "#0B1020",
        paper: isLight ? "#FFFFFF" : "#141A2E",
      },
      text: {
        primary: isLight ? "#111827" : "#E5E7EB",
        secondary: isLight ? "#6B7280" : "#9CA3AF",
      },
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily:
        'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h4: { fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontWeight: 700 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isLight
              ? `radial-gradient(1200px 600px at 100% -10%, ${alpha(INDIGO, 0.12)}, transparent), radial-gradient(900px 500px at -10% 110%, ${alpha("#14B8A6", 0.1)}, transparent)`
              : `radial-gradient(1200px 600px at 100% -10%, ${alpha(INDIGO, 0.22)}, transparent), radial-gradient(900px 500px at -10% 110%, ${alpha("#14B8A6", 0.14)}, transparent)`,
            backgroundAttachment: "fixed",
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "transparent" },
        styleOverrides: {
          root: {
            backdropFilter: "blur(12px)",
            backgroundColor: alpha(isLight ? "#FFFFFF" : "#0B1020", 0.7),
            borderBottom: `1px solid ${alpha(isLight ? "#111827" : "#E5E7EB", 0.08)}`,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${alpha(isLight ? "#111827" : "#E5E7EB", 0.08)}`,
            boxShadow: isLight
              ? "0 8px 24px rgba(17,24,39,0.06)"
              : "0 8px 24px rgba(0,0,0,0.35)",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12, paddingInline: 20 },
        },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined" },
      },
      MuiPaper: {
        styleOverrides: { rounded: { borderRadius: 16 } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
    },
  });
}
