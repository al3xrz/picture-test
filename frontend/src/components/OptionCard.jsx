import {
  Box,
  Card,
  CardActionArea,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";

// Виды подсветки варианта после ответа: правильный, неверный, показ верного.
const VARIANTS = {
  correct: {
    color: "success.main",
    Icon: CheckCircleRoundedIcon,
  },
  wrong: {
    color: "error.main",
    Icon: CancelRoundedIcon,
  },
  reveal: {
    color: "success.main",
    Icon: CheckCircleRoundedIcon,
  },
};

/**
 * Карточка варианта ответа с визуальной обратной связью.
 * @param {object} props
 * @param {string} props.letter — бейдж варианта (A, B, C…)
 * @param {string} props.text — текст варианта
 * @param {"idle"|"correct"|"wrong"|"reveal"} [props.state] — состояние подсветки
 * @param {Function} props.onClick — обработчик выбора (только для state="idle")
 */
export default function OptionCard({ letter, text, state = "idle", onClick, animationsOn = true }) {
  const variant = state === "idle" ? null : VARIANTS[state];
  const iconColor = variant?.color;
  const highlightedCorrect = state === "correct" || state === "reveal";
  const answerLabel = state === "correct" || state === "wrong"
    ? "Ваш ответ"
    : state === "reveal" ? "Правильный ответ" : null;

  return (
    <Card
      sx={{
        borderColor: variant ? iconColor : undefined,
        borderWidth: variant ? 2 : 1,
        bgcolor: variant
          ? (theme) => alpha(theme.palette[state === "wrong" ? "error" : "success"].main, 0.1)
          : undefined,
        transform: animationsOn && highlightedCorrect
          ? { xs: "scale(1.03)", md: "scale(1.05)" }
          : undefined,
        position: highlightedCorrect ? "relative" : undefined,
        zIndex: highlightedCorrect ? 1 : undefined,
        transition: animationsOn
          ? "transform .15s ease, box-shadow .15s ease, border-color .2s ease"
          : "none",
        "&:hover": { transform: animationsOn && state === "idle" ? "translateY(-2px)" : "none" },
      }}
    >
      <CardActionArea
        onClick={onClick}
        disabled={state !== "idle"}
        sx={{ p: highlightedCorrect ? { xs: 2.25, md: 2 } : { xs: 1.5, md: 1.25 } }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: highlightedCorrect ? { xs: 42, md: 46 } : { xs: 32, md: 30 },
              height: highlightedCorrect ? { xs: 42, md: 46 } : { xs: 32, md: 30 },
              flexShrink: 0,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              bgcolor: variant ? iconColor : "action.hover",
              color: variant ? "common.white" : "text.secondary",
            }}
          >
            {letter}
          </Box>
          <Stack sx={{ flex: 1 }} spacing={0.15}>
            {answerLabel && (
              <Typography variant="caption" color={highlightedCorrect ? "success.main" : "error.main"}>
                {answerLabel}
              </Typography>
            )}
            <Typography
            sx={{
              fontWeight: variant ? 600 : 500,
              fontSize: highlightedCorrect ? { xs: "1.15rem", md: "1.25rem" } : undefined,
            }}
            >{text}</Typography>
          </Stack>
          {variant && <variant.Icon sx={{ color: iconColor }} />}
        </Stack>
      </CardActionArea>
    </Card>
  );
}
