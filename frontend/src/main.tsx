import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import { AuthProvider } from "./components/AuthContext";
import "./index.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      dark: "#1d4ed8",
      light: "#dbeafe",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0f766e",
    },
    background: {
      default: "#f5f7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#172033",
      secondary: "#667085",
    },
    divider: "#e7eaf0",
    success: {
      main: "#15803d",
    },
    warning: {
      main: "#b45309",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 750,
      letterSpacing: "-0.025em",
      lineHeight: 1.2,
    },
    h2: { fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.015em" },
    h3: { fontSize: "1.05rem", fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 650 },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 9,
          minHeight: 40,
          paddingInline: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e7eaf0",
          boxShadow: "0 8px 28px rgba(23, 32, 51, 0.04)",
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 650,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.75rem",
        },
      },
    },
  },
});

const root = document.getElementById("root");

if (!root) {
  throw new Error("The application root element is missing.");
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
