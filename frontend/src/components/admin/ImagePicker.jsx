import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import CropRoundedIcon from "@mui/icons-material/CropRounded";
import { api, extractError } from "../../api";

const CROP_SIZE = { width: 1600, height: 1000 };
const CROP_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function clampOffset(offset, image, zoom) {
  if (!image) return offset;
  const scale = Math.max(CROP_SIZE.width / image.naturalWidth, CROP_SIZE.height / image.naturalHeight) * zoom;
  const maxX = Math.max(0, (image.naturalWidth * scale - CROP_SIZE.width) / 2);
  const maxY = Math.max(0, (image.naturalHeight * scale - CROP_SIZE.height) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

function drawCrop(canvas, image, zoom, offset) {
  if (!canvas || !image) return;
  const context = canvas.getContext("2d");
  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * zoom;
  const x = (canvas.width - image.naturalWidth * scale) / 2 + offset.x * (canvas.width / CROP_SIZE.width);
  const y = (canvas.height - image.naturalHeight * scale) / 2 + offset.y * (canvas.height / CROP_SIZE.height);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, x, y, image.naturalWidth * scale, image.naturalHeight * scale);
}

function CropDialog({ source, open, busy, onCancel, onConfirm }) {
  const previewRef = useRef(null);
  const exportRef = useRef(null);
  const dragRef = useRef(null);
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!source) return undefined;
    const nextImage = new window.Image();
    nextImage.onload = () => setImage(nextImage);
    nextImage.src = source;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => {
      nextImage.onload = null;
      setImage(null);
    };
  }, [source]);

  useEffect(() => {
    drawCrop(previewRef.current, image, zoom, offset);
  }, [image, zoom, offset]);

  const onPointerDown = (event) => {
    if (!image || busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, offset };
  };

  const onPointerMove = (event) => {
    if (!dragRef.current || !image) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const next = {
      x: dragRef.current.offset.x + (event.clientX - dragRef.current.x) * CROP_SIZE.width / bounds.width,
      y: dragRef.current.offset.y + (event.clientY - dragRef.current.y) * CROP_SIZE.height / bounds.height,
    };
    setOffset(clampOffset(next, image, zoom));
  };

  const stopDragging = () => {
    dragRef.current = null;
  };

  const confirm = () => {
    if (!image || busy) return;
    const canvas = exportRef.current;
    drawCrop(canvas, image, zoom, offset);
    canvas.toBlob((blob) => {
      if (blob) onConfirm(new window.File([blob], "cropped-image.webp", { type: "image/webp" }));
    }, "image/webp", 0.9);
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} fullWidth maxWidth="md">
      <DialogTitle>Настройка изображения</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Перетащите изображение, чтобы выбрать центр. Формат теста — 16:10.
          </Typography>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 10",
              overflow: "hidden",
              borderRadius: 2,
              bgcolor: "#111827",
              cursor: busy ? "default" : "grab",
              touchAction: "none",
            }}
          >
            <canvas
              ref={previewRef}
              width={800}
              height={500}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          </Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CropRoundedIcon color="action" />
            <Typography variant="body2" sx={{ minWidth: 64 }}>Масштаб</Typography>
            <Slider
              min={0.6}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(_, value) => {
                const nextZoom = Number(value);
                setZoom(nextZoom);
                setOffset((currentOffset) => clampOffset(currentOffset, image, nextZoom));
              }}
              valueLabelDisplay="auto"
              disabled={!image || busy}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            При уменьшении по краям могут появиться прозрачные поля.
          </Typography>
          <canvas ref={exportRef} width={CROP_SIZE.width} height={CROP_SIZE.height} hidden />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit" disabled={busy}>Отмена</Button>
        <Button onClick={confirm} variant="contained" disabled={!image || busy}>
          {busy ? <CircularProgress size={22} color="inherit" /> : "Применить кадрирование"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Выбор изображения вопроса: загрузка, кадрирование и внешний URL. */
export default function ImagePicker({ value, onChange }) {
  const [tab, setTab] = useState(
    value && value.startsWith("/uploads/") ? 0 : value ? 1 : 0,
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [crop, setCrop] = useState(null);
  const inputRef = useRef(null);

  const upload = async (file) => {
    if (!file) return false;
    setUploading(true);
    setError(null);
    try {
      const { url } = await api.adminUpload(file);
      onChange(url);
      setTab(0);
      return true;
    } catch (e) {
      setError(extractError(e));
      return false;
    } finally {
      setUploading(false);
    }
  };

  const selectFile = (file) => {
    if (!file) return;
    if (CROP_TYPES.has(file.type)) {
      setError(null);
      setCrop({ source: window.URL.createObjectURL(file) });
    } else {
      upload(file);
    }
  };

  const cancelCrop = () => {
    if (crop?.source) window.URL.revokeObjectURL(crop.source);
    setCrop(null);
  };

  const confirmCrop = async (file) => {
    const uploaded = await upload(file);
    if (uploaded) cancelCrop();
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  return (
    <Stack spacing={2}>
      <CropDialog
        source={crop?.source}
        open={Boolean(crop)}
        busy={uploading}
        onCancel={cancelCrop}
        onConfirm={confirmCrop}
      />
      <Tabs value={tab} onChange={(_, value) => setTab(value)}>
        <Tab icon={<CloudUploadRoundedIcon />} iconPosition="start" label="Загрузить" />
        <Tab icon={<LinkRoundedIcon />} iconPosition="start" label="URL" />
      </Tabs>

      {error && <Alert severity="error">{error}</Alert>}

      {tab === 0 && (
        <Box
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: "2px dashed",
            borderColor: dragOver ? "primary.main" : "divider",
            bgcolor: dragOver
              ? (theme) => alpha(theme.palette.primary.main, 0.06)
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
            onChange={(event) => {
              selectFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {uploading ? (
            <CircularProgress size={32} />
          ) : (
            <Stack spacing={1} alignItems="center">
              <CloudUploadRoundedIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography fontWeight={600}>Перетащите файл или нажмите</Typography>
              <Typography variant="caption" color="text.secondary">
                JPG, PNG, WEBP · с кадрированием; GIF, SVG · до 5 МБ
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
          onChange={(event) => onChange(event.target.value)}
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
            <Link component="button" type="button" underline="hover" onClick={() => onChange("")}>Очистить</Link>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
