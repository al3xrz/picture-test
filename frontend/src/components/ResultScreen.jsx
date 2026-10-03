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
 * @param {object} props.rewards — очки и лучшая серия за прохождение
 * @param {boolean} props.animationsOn — включены ли анимации
 * @param {Function} props.onRetry — сброс и повторное прохождение
 */
export default function ResultScreen({ result, questions, rewards, animationsOn = true, onRetry }) {
  const percent = result.total ? Math.round((result.score / result.total) * 100) : 0;
  const perfect = percent === 100;
  const good = percent >= 60;

  return (
    <Fade in timeout={animationsOn ? 400 : 0}>
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

            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              <Chip color="primary" label={`${rewards?.points ?? 0} очков`} />
              <Chip
                color="warning"
                variant="outlined"
                label={`Лучшая серия: ${rewards?.bestStreak ?? 0}`}
              />
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 3 }}
              divider={<Divider orientation="vertical" flexItem />}
              alignItems="center"
              sx={{ color: "text.secondary" }}
            >
              <Typography>Правильных: {result.score}</Typography>
              <Typography>Ошибок: {Math.max(0, result.total - result.score)}</Typography>
              <Typography>Всего вопросов: {result.total}</Typography>
            </Stack>

            <Button
              variant="contained"
              size="large"
              startIcon={<ReplayRoundedIcon />}
              onClick={onRetry}
              sx={{
                minWidth: { xs: 220, md: 280 },
                minHeight: { xs: 54, md: 62 },
                px: { xs: 3, md: 4 },
                fontSize: { xs: "1.05rem", md: "1.15rem" },
                fontWeight: 700,
              }}
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
              const selectedOption = question.options.find(
                (o) => o.id === detail.selected_option_id,
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
                    <Typography sx={{ fontWeight: 600 }}>
                      Ваш ответ: {selectedOption?.text || "Нет ответа"}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      Правильный ответ: {correctOption?.text}
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
