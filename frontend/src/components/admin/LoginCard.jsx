import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { api, auth, extractError } from "../../api";

/** Форма входа в админку: проверяет Basic-креды запросом к API. */
export default function LoginCard({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    auth.save({ username, password });
    try {
      await api.adminList();
      onSuccess();
    } catch (e) {
      auth.clear();
      setError(e?.response?.status === 401 ? "Неверный логин или пароль" : extractError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
      <Card sx={{ p: { xs: 3, md: 4 }, width: "100%", maxWidth: 400 }}>
        <form onSubmit={submit}>
          <Stack spacing={2.5}>
            <Stack spacing={0.5} alignItems="center">
              <LockOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
              <Typography variant="h5">Вход в админку</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                HTTP Basic. Данные хранятся только в текущей сессии браузера.
              </Typography>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              fullWidth
            />
            <TextField
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
            >
              {loading ? "Проверка…" : "Войти"}
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
}
