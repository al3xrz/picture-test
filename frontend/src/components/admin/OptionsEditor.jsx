import {
  Button,
  FormControlLabel,
  IconButton,
  Radio,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

/** Редактор вариантов ответа: добавление/удаление и выбор правильного. */
export default function OptionsEditor({ value, onChange }) {
  // Меняет поля одного варианта, сохраняя остальные.
  const update = (index, patch) =>
    onChange(value.map((option, i) => (i === index ? { ...option, ...patch } : option)));

  // Делает вариант правильным, снимая флаг с остальных.
  const setCorrect = (index) =>
    onChange(value.map((option, i) => ({ ...option, is_correct: i === index })));

  // Добавляет пустой вариант; первый автоматически становится правильным.
  const add = () =>
    onChange([...value, { text: "", is_correct: value.length === 0 }]);

  // Удаляет вариант, следя, чтобы всегда был выбран правильный.
  const remove = (index) => {
    const next = value.filter((_, i) => i !== index);
    if (next.length && !next.some((o) => o.is_correct)) next[0].is_correct = true;
    onChange(next);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>
          Варианты ответа
        </Typography>
        <Button startIcon={<AddRoundedIcon />} onClick={add} size="small">
          Добавить
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {value.map((option, index) => (
          <Stack key={index} direction="row" alignItems="center" spacing={1}>
            <FormControlLabel
              control={
                <Radio
                  checked={option.is_correct}
                  onChange={() => setCorrect(index)}
                  inputProps={{ "aria-label": "Правильный ответ" }}
                />
              }
              label=""
              sx={{ m: 0 }}
            />
            <TextField
              value={option.text}
              onChange={(e) => update(index, { text: e.target.value })}
              placeholder={`Вариант ${index + 1}`}
              size="small"
              fullWidth
            />
            <IconButton
              onClick={() => remove(index)}
              disabled={value.length <= 2}
              color="error"
              size="small"
            >
              <DeleteOutlineRoundedIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Минимум 2 варианта и ровно один правильный (отмечен радио-кнопкой).
      </Typography>
    </Stack>
  );
}
