import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";

/** Миниатюра изображения вопроса в списке разбора. */
function ResultImage({ src }) {
  return (
    <Box
      component="img"
      src={src}
      alt=""
      sx={{
        width: 72,
        height: 54,
        objectFit: "cover",
        borderRadius: 2,
        flexShrink: 0,
        bgcolor: "action.hover",
      }}
    />
  );
}

/**
 * Финальный экран: круговой индикатор счёта и разбор ответов по вопросам.
 * @param {object} props
 * @param {object} props.result — { score, total, details }
 * @param {Array} props.questions — вопросы для поиска текста верного ответа
 * @param {Function} props.onRetry — сброс и повторное прохождение
 */
export default function ResultScreen({ result, questions, onRetry }) {
  const percent = result.total ? Math.round((result.score / result.total) * 100) : 0;
  const perfect = percent === 100;
  const good = percent >= 60;

  return (
    <Fade in>
      <Stack spacing={4} alignItems="center">
        <Card sx={{ p: { xs: 3, md: 5 }, width: "100%", maxWidth: 720 }}>
          <Stack spacing={3} alignItems="center">
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={148}
                thickness={4}
                sx={{ color: (t) => alpha(t.palette.primary.main, 0.15) }}
              />
              <CircularProgress
                variant="determinate"
                value={percent}
                size={148}
                thickness={4}
                color={perfect ? "success" : good ? "primary" : "error"}
                sx={{ position: "absolute", left: 0 }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Typography variant="h4">
                  {result.score}/{result.total}
                </Typography>
              </Box>
            </Box>

            <Stack alignItems="center" spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                {perfect && <EmojiEventsRoundedIcon color="warning" />}
                <Typography variant="h5">
                  {perfect ? "Идеально!" : good ? "Хороший результат" : "Стоит повторить"}
                </Typography>
              </Stack>
              <Typography color="text.secondary">
                Правильных ответов: {percent}%
              </Typography>
            </Stack>

            <Button
              size="large"
              startIcon={<ReplayRoundedIcon />}
              onClick={onRetry}
            >
              Пройти снова
            </Button>
          </Stack>
        </Card>

        <Card sx={{ width: "100%", maxWidth: 720, p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Разбор ответов
          </Typography>
          <Stack divider={<Divider flexItem />} spacing={2}>
            {result.details.map((detail, index) => {
              const question = questions.find((q) => q.id === detail.question_id);
              if (!question) return null;
              const correctOption = question.options.find(
                (o) => o.id === detail.correct_option_id,
              );
              return (
                <Stack
                  key={detail.question_id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                >
                  <ResultImage src={question.image_url} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      Вопрос {index + 1}
                    </Typography>
                    <Typography noWrap sx={{ fontWeight: 600 }}>
                      {correctOption?.text}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={detail.is_correct ? "Верно" : "Ошибка"}
                    color={detail.is_correct ? "success" : "error"}
                    variant={detail.is_correct ? "filled" : "outlined"}
                  />
                </Stack>
              );
            })}
          </Stack>
        </Card>
      </Stack>
    </Fade>
  );
}
