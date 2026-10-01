import { useRef, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { api, extractError } from "../../api";

/**
 * Выбор изображения вопроса: вкладки «Загрузить» (drag&drop) и «URL»,
 * с предпросмотром и возможностью очистить.
 * @param {object} props
 * @param {string} props.value — текущий URL изображения
 * @param {(url: string) => void} props.onChange — вызывается при смене URL
 */
export default function ImagePicker({ value, onChange }) {
  const [tab, setTab] = useState(
    value && value.startsWith("/uploads/") ? 0 : value ? 1 : 0,
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Загружает файл на сервер и подставляет полученный URL.
  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await api.adminUpload(file);
      onChange(url);
      setTab(0);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setUploading(false);
    }
  };

  // Обработка перетаскивания файла в зону загрузки.
  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    upload(event.dataTransfer.files?.[0]);
  };

  return (
    <Stack spacing={2}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab icon={<CloudUploadRoundedIcon />} iconPosition="start" label="Загрузить" />
        <Tab icon={<LinkRoundedIcon />} iconPosition="start" label="URL" />
      </Tabs>

      {error && <Alert severity="error">{error}</Alert>}

      {tab === 0 && (
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: "2px dashed",
            borderColor: dragOver ? "primary.main" : "divider",
            bgcolor: dragOver
              ? (t) => alpha(t.palette.primary.main, 0.06)
              : "action.hover",
            borderRadius: 3,
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color .15s ease, background-color .15s ease",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => upload(e.target.files?.[0])}
          />
          {uploading ? (
            <CircularProgress size={32} />
          ) : (
            <Stack spacing={1} alignItems="center">
              <CloudUploadRoundedIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography fontWeight={600}>
                Перетащите файл или нажмите
              </Typography>
              <Typography variant="caption" color="text.secondary">
                JPG, PNG, WEBP, GIF, SVG · до 5 МБ
              </Typography>
            </Stack>
          )}
        </Box>
      )}

      {tab === 1 && (
        <TextField
          label="Внешняя ссылка на изображение"
          placeholder="https://example.com/image.jpg"
          value={value && !value.startsWith("/uploads/") ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
        />
      )}

      {value && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            {tab === 0 ? "Загруженное изображение" : "Предпросмотр"}
          </Typography>
          <Box
            component="img"
            src={value}
            alt="Предпросмотр"
            sx={{
              mt: 0.5,
              width: "100%",
              maxHeight: 260,
              objectFit: "contain",
              borderRadius: 2,
              bgcolor: "action.hover",
            }}
          />
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => onChange("")}
            >
              Очистить
            </Link>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
