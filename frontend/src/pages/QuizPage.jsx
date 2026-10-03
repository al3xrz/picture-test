import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  Collapse,
  Fade,
  FormControlLabel,
  LinearProgress,
  Skeleton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import { api, extractError } from "../api";
import { shuffleQuiz } from "../utils/shuffle";
import OptionCard from "../components/OptionCard";
import ResultScreen from "../components/ResultScreen";

const LETTERS = "ABCDEFGH";

// Ключ хранения настройки перемешивания в localStorage.
const SHUFFLE_KEY = "pt.shuffle";
const AUTO_ADVANCE_KEY = "pt.auto-advance";
const MOTION_KEY = "pt.motion";

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

function RewardBurst() {
  const colors = ["#6366F1", "#14B8A6", "#F59E0B", "#22C55E", "#EF4444"];
  const pieces = Array.from({ length: 22 }, (_, index) => index);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 2,
        "@keyframes reward-piece": {
          from: { opacity: 1, transform: "translate(0, 0) rotate(0deg)" },
          to: {
            opacity: 0,
            transform: "translate(var(--x), var(--y)) rotate(420deg)",
          },
        },
      }}
    >
      {pieces.map((piece) => (
        <Box
          key={piece}
          sx={{
            "--x": `${(piece - 10.5) * 34}px`,
            "--y": `${-90 - (piece % 5) * 28}px`,
            position: "absolute",
            top: "45%",
            left: "50%",
            width: piece % 3 === 0 ? 10 : 8,
            height: piece % 3 === 0 ? 18 : 14,
            borderRadius: 1,
            bgcolor: colors[piece % colors.length],
            animation: "reward-piece 1.25s cubic-bezier(.2,.75,.35,1) forwards",
            animationDelay: `${piece * 25}ms`,
          }}
        />
      ))}
    </Box>
  );
}

/**
 * Страница прохождения теста: показывает вопросы по одному, при выборе ответа
 * мгновенно подсвечивает верный/неверный вариант, в конце — экран результата.
 */
export default function QuizPage() {
  // Исходный порядок с сервера; хранится, чтобы перестраивать без запроса.
  const sourceRef = useRef([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shuffleOn, setShuffleOn] = useState(
    () => localStorage.getItem(SHUFFLE_KEY) !== "off",
  );
  const [autoAdvanceOn, setAutoAdvanceOn] = useState(
    () => localStorage.getItem(AUTO_ADVANCE_KEY) !== "off",
  );
  const [animationsOn, setAnimationsOn] = useState(
    () => localStorage.getItem(MOTION_KEY) !== "off",
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [autoNextIn, setAutoNextIn] = useState(null);
  const [rewards, setRewards] = useState({ points: 0, streak: 0, bestStreak: 0 });

  useEffect(() => {
    api
      .fetchQuiz()
      .then((data) => {
        sourceRef.current = data;
        setQuestions(shuffleOn ? shuffleQuiz(data) : data);
      })
      .catch((e) => setError(extractError(e)))
      .finally(() => setLoading(false));
    // shuffleOn читается только при первом запросе; при переключении порядок
    // перестраивается в toggleShuffle без повторного обращения к API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = questions[index];
  const currentFeedback = current ? feedback[current.id] : null;
  const isLast = index === questions.length - 1;
  const progress = useMemo(
    () => (questions.length ? ((index + 1) / questions.length) * 100 : 0),
    [index, questions.length],
  );

  // После правильного ответа автоматически открывает следующий вопрос через 5 секунд.
  useEffect(() => {
    if (!autoAdvanceOn || !currentFeedback?.is_correct || isLast) {
      setAutoNextIn(null);
      return undefined;
    }

    setAutoNextIn(5);
    const interval = window.setInterval(() => {
      setAutoNextIn((seconds) => (seconds && seconds > 1 ? seconds - 1 : seconds));
    }, 1000);
    const timeout = window.setTimeout(() => {
      setAutoNextIn(null);
      setIndex((currentIndex) => Math.min(currentIndex + 1, questions.length - 1));
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [autoAdvanceOn, currentFeedback?.is_correct, current?.id, isLast, questions.length]);

  const select = async (optionId) => {
    if (currentFeedback || checking) return;
    setError(null);
    setAnswers((prev) => ({ ...prev, [current.id]: optionId }));
    setChecking(true);
    try {
      const fb = await api.checkAnswer(current.id, optionId);
      setFeedback((prev) => ({ ...prev, [current.id]: fb }));
      setRewards((prev) => {
        const streak = fb.is_correct ? prev.streak + 1 : 0;
        return {
          points: prev.points + (fb.is_correct ? 100 : 0),
          streak,
          bestStreak: Math.max(prev.bestStreak, streak),
        };
      });
    } catch (e) {
      setError(extractError(e));
    } finally {
      setChecking(false);
    }
  };

  const goNext = () => {
    setAutoNextIn(null);
    setIndex((currentIndex) => Math.min(currentIndex + 1, questions.length - 1));
  };

  const togglePreference = (key, setter, value) => {
    localStorage.setItem(key, value ? "on" : "off");
    setter(value);
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
    setQuestions(shuffleOn ? shuffleQuiz(sourceRef.current) : sourceRef.current);
    setAnswers({});
    setFeedback({});
    setIndex(0);
    setResult(null);
    setRewards({ points: 0, streak: 0, bestStreak: 0 });
  };

  // Переключает перемешивание; порядок меняется, поэтому прохождение
  // сбрасывается, чтобы вопросы не «прыгали» посреди теста.
  const toggleShuffle = (next) => {
    localStorage.setItem(SHUFFLE_KEY, next ? "on" : "off");
    setShuffleOn(next);
    setQuestions(next ? shuffleQuiz(sourceRef.current) : sourceRef.current);
    setAnswers({});
    setFeedback({});
    setIndex(0);
    setResult(null);
    setRewards({ points: 0, streak: 0, bestStreak: 0 });
  };

  if (loading) {
    return <Skeleton variant="rounded" height={{ xs: 420, md: 500 }} sx={{ maxWidth: 1080, mx: "auto" }} />;
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
      <ResultScreen
        result={result}
        questions={questions}
        rewards={rewards}
        animationsOn={animationsOn}
        onRetry={reset}
      />
    );
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ maxWidth: 1080, mx: "auto" }}>
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Вопрос {index + 1} из {questions.length}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={{ xs: 0.5, sm: 1 }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Отвечено: {Object.keys(feedback).length}
            </Typography>
            <Chip size="small" color="primary" variant="outlined" label={`${rewards.points} очков`} />
            {rewards.streak > 1 && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={`Серия ${rewards.streak}`}
              />
            )}
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              spacing={{ xs: 0.5, sm: 1 }}
              sx={{ width: "100%" }}
            >
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  size="small"
                  checked={autoAdvanceOn}
                  onChange={(event) => togglePreference(AUTO_ADVANCE_KEY, setAutoAdvanceOn, event.target.checked)}
                  inputProps={{ "aria-label": "Автоматически переходить дальше" }}
                />
              }
              label={<Typography variant="caption" color="text.secondary">Автопереход</Typography>}
            />
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  size="small"
                  checked={animationsOn}
                  onChange={(event) => togglePreference(MOTION_KEY, setAnimationsOn, event.target.checked)}
                  inputProps={{ "aria-label": "Включить анимации" }}
                />
              }
              label={<Typography variant="caption" color="text.secondary">Анимации</Typography>}
            />
            <Tooltip title="Перемешивать вопросы и варианты">
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={shuffleOn}
                    onChange={(e) => toggleShuffle(e.target.checked)}
                    inputProps={{
                      "aria-label": "Перемешивать вопросы и варианты",
                    }}
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <ShuffleRoundedIcon fontSize="small" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Перемешать
                    </Typography>
                  </Stack>
                }
              />
            </Tooltip>
            </Stack>
          </Stack>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Fade in key={current.id} timeout={animationsOn ? 300 : 0}>
        <Box sx={{ position: "relative" }}>
          {currentFeedback?.is_correct && animationsOn && <RewardBurst />}
          <Card
            sx={{
              display: { xs: "block", md: "grid" },
              gridTemplateColumns: "minmax(360px, 0.95fr) minmax(420px, 1.05fr)",
              overflow: "hidden",
            }}
          >
            <CardMedia
              component="img"
              image={current.image_url}
              alt="Изображение к вопросу"
              sx={{
                height: { xs: "auto", md: "100%" },
                minHeight: { xs: 220, md: 420 },
                maxHeight: { xs: 420, md: "none" },
                aspectRatio: { xs: "16 / 10", md: "auto" },
                objectFit: "cover",
                bgcolor: "action.hover",
              }}
            />
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Выберите правильный ответ
              </Typography>
              <Stack spacing={1}>
                {current.options.map((option, i) => (
                  <OptionCard
                    key={option.id}
                    letter={LETTERS[i] || "?"}
                    text={option.text}
                    state={optionState(option, currentFeedback)}
                    animationsOn={animationsOn}
                    onClick={() => select(option.id)}
                  />
                ))}
              </Stack>

              <Collapse in={Boolean(currentFeedback)} sx={{ mt: 1.5 }}>
                <Alert
                  severity={currentFeedback?.is_correct ? "success" : "error"}
                  variant="outlined"
                  action={
                    currentFeedback?.is_correct && !isLast ? (
                      <Button
                        color="inherit"
                        size="small"
                        variant="outlined"
                        onClick={goNext}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        Перейти сейчас
                      </Button>
                    ) : undefined
                  }
                  sx={{ alignItems: "flex-start", overflowWrap: "anywhere" }}
                >
                  {currentFeedback?.is_correct
                    ? autoNextIn
                      ? `Верно! +100 очков · Серия: ${rewards.streak}. Следующий вопрос через ${autoNextIn} сек.`
                      : `Верно! +100 очков · Серия: ${rewards.streak}. Перейдите к следующему вопросу.`
                    : "Неверно. Правильный ответ подсвечен зелёным."}
                </Alert>
              </Collapse>
            </Box>
          </Card>
        </Box>
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
            sx={{
              minWidth: currentFeedback?.is_correct ? { xs: 170, md: 220 } : 140,
              minHeight: currentFeedback?.is_correct ? { xs: 52, md: 58 } : 48,
              fontSize: currentFeedback?.is_correct ? { xs: "1rem", md: "1.08rem" } : undefined,
            }}
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
            sx={{
              minWidth: currentFeedback?.is_correct ? { xs: 150, md: 200 } : 120,
              minHeight: currentFeedback?.is_correct ? { xs: 52, md: 58 } : 48,
              fontSize: currentFeedback?.is_correct ? { xs: "1rem", md: "1.08rem" } : undefined,
            }}
          >
            Далее
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
