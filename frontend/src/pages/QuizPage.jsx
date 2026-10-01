import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardMedia,
  Collapse,
  Fade,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import { api, extractError } from "../api";
import OptionCard from "../components/OptionCard";
import ResultScreen from "../components/ResultScreen";

const LETTERS = "ABCDEFGH";

// Определяет вид подсветки варианта по результату проверки ответа.
function optionState(option, feedback) {
  if (!feedback) return "idle";
  if (option.id === feedback.selected_option_id) {
    return feedback.is_correct ? "correct" : "wrong";
  }
  if (!feedback.is_correct && option.id === feedback.correct_option_id) {
    return "reveal";
  }
  return "idle";
}

/**
 * Страница прохождения теста: показывает вопросы по одному, при выборе ответа
 * мгновенно подсвечивает верный/неверный вариант, в конце — экран результата.
 */
export default function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .fetchQuiz()
      .then(setQuestions)
      .catch((e) => setError(extractError(e)))
      .finally(() => setLoading(false));
  }, []);

  const current = questions[index];
  const currentFeedback = current ? feedback[current.id] : null;
  const isLast = index === questions.length - 1;
  const progress = useMemo(
    () => (questions.length ? ((index + 1) / questions.length) * 100 : 0),
    [index, questions.length],
  );

  const select = async (optionId) => {
    if (currentFeedback || checking) return;
    setError(null);
    setAnswers((prev) => ({ ...prev, [current.id]: optionId }));
    setChecking(true);
    try {
      const fb = await api.checkAnswer(current.id, optionId);
      setFeedback((prev) => ({ ...prev, [current.id]: fb }));
    } catch (e) {
      setError(extractError(e));
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = questions.map((q) => ({
        question_id: q.id,
        option_id: answers[q.id] ?? null,
      }));
      setResult(await api.submitQuiz(payload));
    } catch (e) {
      setError(extractError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setAnswers({});
    setFeedback({});
    setIndex(0);
    setResult(null);
  };

  if (loading) {
    return (
      <Stack spacing={3} sx={{ maxWidth: 760, mx: "auto" }}>
        <Skeleton variant="rounded" height={420} />
      </Stack>
    );
  }

  if (error && !questions.length) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!questions.length) {
    return (
      <Alert severity="info">
        Пока нет ни одного вопроса. Добавьте их в админке.
      </Alert>
    );
  }

  if (result) {
    return (
      <ResultScreen result={result} questions={questions} onRetry={reset} />
    );
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 760, mx: "auto" }}>
      <Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Вопрос {index + 1} из {questions.length}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Отвечено: {Object.keys(feedback).length}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Fade in key={current.id}>
        <Card>
          <CardMedia
            component="img"
            image={current.image_url}
            alt="Изображение к вопросу"
            sx={{
              aspectRatio: "16 / 10",
              objectFit: "cover",
              bgcolor: "action.hover",
            }}
          />
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Выберите правильный ответ
            </Typography>
            <Stack spacing={1.5}>
              {current.options.map((option, i) => (
                <OptionCard
                  key={option.id}
                  letter={LETTERS[i] || "?"}
                  text={option.text}
                  state={optionState(option, currentFeedback)}
                  onClick={() => select(option.id)}
                />
              ))}
            </Stack>

            <Collapse in={Boolean(currentFeedback)} sx={{ mt: 2 }}>
              <Alert
                severity={currentFeedback?.is_correct ? "success" : "error"}
                variant="outlined"
              >
                {currentFeedback?.is_correct
                  ? "Верно!"
                  : "Неверно. Правильный ответ подсвечен зелёным."}
              </Alert>
            </Collapse>
          </Box>
        </Card>
      </Fade>

      <Stack direction="row" justifyContent="space-between">
        <Button
          color="inherit"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Назад
        </Button>
        {isLast ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<DoneAllRoundedIcon />}
            onClick={submit}
            disabled={submitting || !currentFeedback}
          >
            Завершить
          </Button>
        ) : (
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => setIndex((i) => i + 1)}
            disabled={checking || !currentFeedback}
          >
            Далее
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
