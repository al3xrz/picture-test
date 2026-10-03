import { useContext } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Quiz as QuizIcon,
} from "@mui/icons-material";
import { ColorModeContext } from "../ColorModeContext";

/** Общий каркас страниц: AppBar с навигацией и переключателем темы, футер. */
export default function Layout() {
  const { mode, toggle } = useContext(ColorModeContext);
  const location = useLocation();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky">
        <Toolbar>
          <QuizIcon sx={{ color: "primary.main", mr: 1.2 }} />
          <Typography
            variant="h6"
            component={NavLink}
            to="/"
            sx={{ textDecoration: "none", color: "text.primary", mr: "auto" }}
          >
            Picture&nbsp;Test
          </Typography>

          <Button
            component={NavLink}
            to="/"
            color={location.pathname === "/" ? "primary" : "inherit"}
          >
            Тест
          </Button>
          <Button
            component={NavLink}
            to="/admin"
            color={location.pathname.startsWith("/admin") ? "primary" : "inherit"}
          >
            Админка
          </Button>
          <Tooltip title={mode === "light" ? "Тёмная тема" : "Светлая тема"}>
            <IconButton onClick={toggle} color="inherit" sx={{ ml: 1 }}>
              {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 2.5, md: 3 } }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{ py: { xs: 2, md: 1.5 }, textAlign: "center", color: "text.secondary" }}
      >
        <Typography variant="caption">
          Picture Test · FastAPI + React MUI
        </Typography>
      </Box>
    </Box>
  );
}
