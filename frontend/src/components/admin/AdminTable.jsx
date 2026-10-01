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
    <TableContainer component={Paper} sx={{ overflow: "hidden" }}>
      <Table>
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
  );
}
