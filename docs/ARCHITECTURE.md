# Архитектура

## Обзор компонентов

```
                 ┌──────────────────────────────┐
   Браузер ─────▶│  nginx (frontend container)  │
                 │  - SPA (React build)         │
                 │  - /api/    → backend:8000   │
                 │  - /uploads/→ backend:8000   │
                 └───────────────┬──────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  FastAPI (backend)       │
                    │  - /api/quiz  (public)   │
                    │  - /api/admin (Basic)    │
                    │  - SQLAlchemy → SQLite   │
                    │  - StaticFiles /uploads  │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  volume /data            │
                    │   ├── app.db (SQLite)    │
                    │   └── uploads/           │
                    └──────────────────────────┘
```

В режиме разработки роль nginx играет Vite dev-server с проксированием
`/api` и `/uploads` на `http://localhost:8000`.

## Backend

- `app/main.py` — создание FastAPI, CORS, монтирование `/uploads`,
  подключение роутеров, `lifespan` создаёт таблицы.
- `app/config.py` — настройки через `pydantic-settings` (env / `.env`).
- `app/database.py` — engine, `SessionLocal`, `Base`, `get_db`, `init_db`.
- `app/models.py` — ORM-модели.
- `app/schemas.py` — Pydantic-схемы (в т.ч. валидация вопроса).
- `app/deps.py` — HTTP Basic (`require_admin`).
- `app/routers/quiz.py` — публичные эндпоинты.
- `app/routers/admin.py` — CRUD и загрузка файлов (под Basic auth).
- `seed.py` — наполнение демо-данными.

### Модель данных

```
questions                         options
─────────                         ───────
id            PK                  id            PK
image_url     str (URL | /uploads/)
position      int                 question_id   FK → questions.id (CASCADE)
created_at    datetime            text          str
                                  is_correct    bool
                                  position      int
```

- У вопроса ≥ 2 варианта и ровно один `is_correct=true` — проверяется
  Pydantic-моделью `QuestionInput` и на клиенте.
- Удаление вопроса каскадно удаляет варианты (`delete-orphan`) и локальный
  файл изображения, если он лежит в `/uploads/`.

## Принятые решения

- **HTTP Basic** для админки — минимум зависимостей, креды в `.env`,
  сравнение через `secrets.compare_digest`. Креды хранятся в браузере только
  на время сессии (`sessionStorage`).
- **uploads/ вместо BLOB** — файлы на диске отдаются nginx/StaticFiles, БД
  остаётся лёгкой. Для внешних ссылок используется то же поле `image_url`.
- **Без сохранения результатов** — `POST /api/quiz/submit` считает счёт
  налету и ничего не пишет в БД.
- **Без пользовательских аккаунтов** — публичная часть анонимна.

## Frontend

- `src/api.js` — axios-клиент, Basic-заголовок для `/api/admin`, разбор ошибок.
- `src/theme.js` + `src/ColorModeContext.jsx` — тема MUI (индиго `#6366F1`),
  светлая/тёмная с сохранением в `localStorage`.
- `src/pages/QuizPage.jsx` — прохождение теста и подсчёт.
- `src/pages/AdminPage.jsx` — вход, список, диалоги, уведомления.
- `src/components/*` — `Layout`, `OptionCard`, `ResultScreen`.
- `src/components/admin/*` — `LoginCard`, `AdminTable`, `QuestionFormDialog`,
  `ImagePicker`, `OptionsEditor`.
