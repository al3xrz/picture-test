import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { api, auth, extractError } from "../api";
import LoginCard from "../components/admin/LoginCard";
import AdminTable from "../components/admin/AdminTable";
import QuestionFormDialog from "../components/admin/QuestionFormDialog";

/**
 * Страница админки: вход по Basic, список вопросов, создание/редактирование
 * в диалоге и подтверждение удаления. Неавторизованным показывает форму входа.
 */
export default function AdminPage() {
  const [authed, setAuthed] = useState(Boolean(auth.get()));
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  // Загружает список вопросов; при 401 разлогинивает.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setQuestions(await api.adminList());
    } catch (e) {
      if (e?.response?.status === 401) {
        auth.clear();
        setAuthed(false);
      } else {
        setError(extractError(e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  // Фильтрует вопросы по тексту вариантов ответа.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return questions;
    return questions.filter((q) =>
      q.options.some((o) => o.text.toLowerCase().includes(query)),
    );
  }, [questions, search]);

  // Очищает креды и возвращает на форму входа.
  const logout = () => {
    auth.clear();
    setAuthed(false);
    setQuestions([]);
  };

  // Удаляет подтверждённый вопрос и перезагружает список.
  const confirmDelete = async () => {
    try {
      await api.adminDelete(deleting.id);
      setToast({ severity: "success", message: "Вопрос удалён" });
      setDeleting(null);
      load();
    } catch (e) {
      setToast({ severity: "error", message: extractError(e) });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (question) => {
    setEditing(question);
    setFormOpen(true);
  };

  if (!authed) {
    return <LoginCard onSuccess={() => setAuthed(true)} />;
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h5">Управление вопросами</Typography>
          <Typography variant="body2" color="text.secondary">
            Всего вопросов: {questions.length}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<RefreshRoundedIcon />}
            onClick={load}
            color="inherit"
          >
            Обновить
          </Button>
          <IconButton onClick={logout} title="Выйти" color="inherit">
            <LogoutRoundedIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openCreate}
          >
            Добавить
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        placeholder="Поиск по вариантам ответа…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Skeleton variant="rounded" height={320} />
      ) : filtered.length ? (
        <AdminTable
          questions={filtered}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      ) : (
        <Card sx={{ p: 6, textAlign: "center" }}>
          <Typography color="text.secondary">
            {questions.length
              ? "Ничего не найдено"
              : "Пока нет вопросов. Добавьте первый."}
          </Typography>
        </Card>
      )}

      <QuestionFormDialog
        open={formOpen}
        question={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setToast({
            severity: "success",
            message: editing ? "Вопрос обновлён" : "Вопрос добавлен",
          });
          load();
        }}
      />

      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>Удалить вопрос?</DialogTitle>
        <DialogContent>
          <Typography>
            Действие необратимо. Изображение, загруженное локально, также будет
            удалено.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleting(null)} color="inherit">
            Отмена
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast(null)}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  );
}
