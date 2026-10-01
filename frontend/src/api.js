import axios from "axios";

// Клиент API. Basic-креды админки хранятся только в sessionStorage
// и автоматически подставляются в заголовок для запросов к /api/admin.
const AUTH_KEY = "pt.auth";

/** Работа с Basic-кредами администратора в текущей сессии браузера. */
export const auth = {
  /** Читает сохранённые креды или возвращает null. */
  get() {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(atob(raw));
    } catch {
      return null;
    }
  },
  /** Сохраняет логин/пароль (base64) на время сессии. */
  save(credentials) {
    sessionStorage.setItem(AUTH_KEY, btoa(JSON.stringify(credentials)));
  },
  /** Удаляет сохранённые креды (выход). */
  clear() {
    sessionStorage.removeItem(AUTH_KEY);
  },
  /** Формирует значение заголовка Authorization или null. */
  header() {
    const creds = auth.get();
    if (!creds) return null;
    return `Basic ${btoa(`${creds.username}:${creds.password}`)}`;
  },
};

const http = axios.create({ baseURL: "/" });

// Подставляет Basic-заголовок во все админские запросы.
http.interceptors.request.use((config) => {
  if (config.url?.includes("/api/admin")) {
    const header = auth.header();
    if (header) config.headers.Authorization = header;
  }
  return config;
});

/** Преобразует ошибку axios/валидации в читаемое сообщение для UI. */
export function extractError(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => d.msg).join("; ");
  }
  return error?.message || "Произошла ошибка";
}

/** Набор методов обращения к backend. */
export const api = {
  /** Статус сервиса и число вопросов. */
  health: () => http.get("/api/health").then((r) => r.data),

  /** Публичный список вопросов без правильных ответов. */
  fetchQuiz: () => http.get("/api/quiz").then((r) => r.data),
  /** Проверка одного ответа для мгновенной подсветки. */
  checkAnswer: (questionId, optionId) =>
    http
      .post("/api/quiz/check", { question_id: questionId, option_id: optionId })
      .then((r) => r.data),
  /** Подсчёт итогового результата по всем ответам. */
  submitQuiz: (answers) =>
    http.post("/api/quiz/submit", { answers }).then((r) => r.data),

  /** Админка: полный список вопросов. */
  adminList: () => http.get("/api/admin/questions").then((r) => r.data),
  /** Админка: создать вопрос. */
  adminCreate: (payload) =>
    http.post("/api/admin/questions", payload).then((r) => r.data),
  /** Админка: обновить вопрос по id. */
  adminUpdate: (id, payload) =>
    http.put(`/api/admin/questions/${id}`, payload).then((r) => r.data),
  /** Админка: удалить вопрос. */
  adminDelete: (id) => http.delete(`/api/admin/questions/${id}`),
  /** Админка: загрузить изображение и получить его публичный URL. */
  adminUpload: (file) => {
    const form = new FormData();
    form.append("file", file);
    return http
      .post("/api/admin/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
