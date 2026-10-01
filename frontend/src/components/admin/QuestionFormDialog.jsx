import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { api, extractError } from "../../api";
import ImagePicker from "./ImagePicker";
import OptionsEditor from "./OptionsEditor";

const EMPTY = {
  image_url: "",
  position: 0,
  options: [
    { text: "", is_correct: true },
    { text: "", is_correct: false },
  ],
};

// Клиентская валидация формы; возвращает текст ошибки или null.
function validate(form) {
  if (!form.image_url.trim()) return "Добавьте изображение (загрузка или URL)";
  if (form.options.length < 2) return "Нужно минимум 2 варианта ответа";
  if (form.options.some((o) => !o.text.trim())) return "Заполните все варианты";
  const correct = form.options.filter((o) => o.is_correct).length;
  if (correct !== 1) return "Отметьте ровно один правильный вариант";
  return null;
}

/**
 * Диалог создания/редактирования вопроса: выбор изображения и редактор вариантов.
 * @param {object} props
 * @param {boolean} props.open — открыт ли диалог
 * @param {object|null} props.question — редактируемый вопрос или null для создания
 * @param {Function} props.onClose — закрытие без сохранения
 * @param {Function} props.onSaved — успешное сохранение
 */
export default function QuestionFormDialog({ open, question, onClose, onSaved }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      question
        ? {
            image_url: question.image_url,
            position: question.position,
            options: question.options.map((o) => ({
              text: o.text,
              is_correct: o.is_correct,
            })),
          }
        : EMPTY,
    );
  }, [open, question]);

  // Валидирует форму и отправляет create/update, затем уведомляет родителя.
  const save = async () => {
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      image_url: form.image_url.trim(),
      position: form.position,
      options: form.options.map((o, index) => ({
        text: o.text.trim(),
        is_correct: o.is_correct,
        position: index,
      })),
    };
    try {
      if (question) await api.adminUpdate(question.id, payload);
      else await api.adminCreate(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(extractError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {question ? "Редактировать вопрос" : "Новый вопрос"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <ImagePicker
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
          />
          <Divider />
          <OptionsEditor
            value={form.options}
            onChange={(options) => setForm((f) => ({ ...f, options }))}
          />
          <Divider />
          <TextField
            label="Порядок (позиция)"
            type="number"
            value={form.position}
            onChange={(e) =>
              setForm((f) => ({ ...f, position: Number(e.target.value) || 0 }))
            }
            sx={{ maxWidth: 200 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Отмена
        </Button>
        <Button onClick={save} variant="contained" disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
