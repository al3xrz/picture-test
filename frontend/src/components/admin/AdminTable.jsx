import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

/** Таблица вопросов в админке с миниатюрой, числом вариантов и действиями. */
export default function AdminTable({ questions, onEdit, onDelete }) {
  return (
    <>
      <TableContainer
        component={Paper}
        sx={{ display: { xs: "none", sm: "block" }, overflowX: "auto" }}
      >
        <Table sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell width={96}>Картинка</TableCell>
            <TableCell>Вопрос</TableCell>
            <TableCell align="center" width={120}>
              Вариантов
            </TableCell>
            <TableCell>Правильный ответ</TableCell>
            <TableCell align="right" width={110}>
              Действия
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {questions.map((question, index) => {
            const correct = question.options.find((o) => o.is_correct);
            return (
              <TableRow key={question.id} hover>
                <TableCell>
                  <Box
                    component="img"
                    src={question.image_url}
                    alt=""
                    sx={{
                      width: 72,
                      height: 48,
                      objectFit: "cover",
                      borderRadius: 1.5,
                      bgcolor: "action.hover",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>
                      Вопрос {index + 1}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        maxWidth: 320,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {question.image_url}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Chip label={question.options.length} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={correct?.text || "—"}
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Редактировать">
                    <IconButton onClick={() => onEdit(question)} size="small">
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Удалить">
                    <IconButton
                      onClick={() => onDelete(question)}
                      size="small"
                      color="error"
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={1.5} sx={{ display: { xs: "flex", sm: "none" } }}>
        {questions.map((question, index) => {
          const correct = question.options.find((o) => o.is_correct);
          return (
            <Paper key={question.id} sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  component="img"
                  src={question.image_url}
                  alt=""
                  sx={{
                    width: 84,
                    height: 64,
                    flexShrink: 0,
                    objectFit: "cover",
                    borderRadius: 1.5,
                    bgcolor: "action.hover",
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography fontWeight={600}>Вопрос {index + 1}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", overflowWrap: "anywhere" }}
                  >
                    {question.image_url}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                  <IconButton
                    onClick={() => onEdit(question)}
                    size="small"
                    aria-label="Редактировать"
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(question)}
                    size="small"
                    color="error"
                    aria-label="Удалить"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 1.25 }}
              >
                <Chip label={`${question.options.length} вариантов`} size="small" />
                <Chip
                  label={correct?.text || "Правильный ответ не выбран"}
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{
                    maxWidth: "100%",
                    "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
                  }}
                />
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </>
  );
}
