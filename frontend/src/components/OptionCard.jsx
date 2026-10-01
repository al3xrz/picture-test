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
export default function OptionCard({ letter, text, state = "idle", onClick }) {
  const variant = state === "idle" ? null : VARIANTS[state];
  const iconColor = variant?.color;

  return (
    <Card
      sx={{
        borderColor: variant ? iconColor : undefined,
        borderWidth: variant ? 2 : 1,
        bgcolor: variant
          ? (theme) => alpha(theme.palette[state === "wrong" ? "error" : "success"].main, 0.1)
          : undefined,
        transition: "transform .15s ease, box-shadow .15s ease, border-color .2s ease",
        "&:hover": { transform: state === "idle" ? "translateY(-2px)" : "none" },
      }}
    >
      <CardActionArea
        onClick={onClick}
        disabled={state !== "idle"}
        sx={{ p: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 34,
              height: 34,
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
          <Typography sx={{ flex: 1, fontWeight: variant ? 600 : 500 }}>
            {text}
          </Typography>
          {variant && <variant.Icon sx={{ color: iconColor }} />}
        </Stack>
      </CardActionArea>
    </Card>
  );
}
